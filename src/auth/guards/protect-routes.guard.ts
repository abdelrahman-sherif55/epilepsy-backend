import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import { Environment } from '../../common/interfaces/environment.interface';
import { UserDocument, Users } from '../../users/users.schema';
import { CustomRequest } from '../../common/interfaces/custom-request.interface';

@Injectable()
export class ProtectRoutesGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<Environment>,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(Users.name) private readonly usersModel: Model<Users>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic: boolean = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getClass(),
    );
    if (isPublic) return true;

    const request: CustomRequest = context
      .switchToHttp()
      .getRequest<CustomRequest>();

    let token: string = '';
    if (
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer')
    )
      token = request.headers.authorization.split(' ')[1];
    else throw new UnauthorizedException('login first to continue');

    let decodedToken: any;
    try {
      decodedToken = this.jwtService.verify(token, {
        secret: this.configService.get('ACCESS_SECRET_KEY', { infer: true }),
      });
    } catch (error) {
      if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError
      )
        throw new UnauthorizedException('session time expired, login again');
    }

    const user: UserDocument = await this.usersModel.findById(decodedToken.id);
    if (!user) throw new UnauthorizedException('user does not exist anymore');

    request.user = user;

    return true;
  }
}
