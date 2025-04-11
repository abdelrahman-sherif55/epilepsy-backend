import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomRequest } from '../../common/interfaces/custom-request.interface';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../../common/interfaces/environment.interface';

@Injectable()
export class ResetPasswordGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<Environment>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: CustomRequest = context
      .switchToHttp()
      .getRequest<CustomRequest>();
    let resetToken: string = '';
    if (
      request.headers.authorization &&
      request.headers.authorization.startsWith('Bearer')
    )
      resetToken = request.headers.authorization.split(' ')[1];
    else throw new ForbiddenException("you can't change the password");
    let decodedToken: any;
    try {
      decodedToken = this.jwtService.verify(resetToken, {
        secret: this.configService.get('RESET_SECRET_KEY', { infer: true }),
      });
    } catch (error) {
      if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError
      )
        throw new ForbiddenException("you can't change the password");
    }

    request.decodedToken = decodedToken;
    return true;
  }
}
