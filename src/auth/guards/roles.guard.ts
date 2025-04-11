import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { Environment } from '../../common/interfaces/environment.interface';
import { Users } from '../../users/users.schema';
import { CustomRequest } from '../../common/interfaces/custom-request.interface';
import { Role, ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class ProtectRoutesGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService<Environment>,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(Users.name) private readonly usersModel: Model<Users>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const roles: Role[] = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles) return true;

    const { user } = context.switchToHttp().getRequest<CustomRequest>();
    if (!roles.includes(user.type))
      throw new ForbiddenException("you can't do that");

    return true;
  }
}
