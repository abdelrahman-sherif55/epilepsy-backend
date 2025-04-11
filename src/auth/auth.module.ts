import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateTokensService } from './create-tokens.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { ProtectRoutesGuard } from './guards/protect-routes.guard';

@Module({
  imports: [JwtModule.register({ global: true }), UsersModule],
  providers: [
    AuthService,
    CreateTokensService,
    { provide: APP_GUARD, useClass: ProtectRoutesGuard },
  ],
  controllers: [AuthController],
  exports: [CreateTokensService],
})
export class AuthModule {}
