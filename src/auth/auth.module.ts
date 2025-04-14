import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateTokensService } from './create-tokens.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { ProtectRoutesGuard } from './guards/protect-routes.guard';
import { PatientsModule } from '../patients/patients.module';
import { FamilyMembersModule } from '../family-members/family-members.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    UsersModule,
    PatientsModule,
    FamilyMembersModule,
    DoctorsModule,
  ],
  providers: [
    AuthService,
    CreateTokensService,
    { provide: APP_GUARD, useClass: ProtectRoutesGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  controllers: [AuthController],
  exports: [CreateTokensService],
})
export class AuthModule {}
