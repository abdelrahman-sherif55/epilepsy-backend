import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PatientsModule } from '../patients/patients.module';
import { FamilyMembersModule } from '../family-members/family-members.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AuthGoogleController } from './auth-google.controller';
import { AuthGoogleService } from './auth-google.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PatientsModule,
    FamilyMembersModule,
    DoctorsModule,
  ],
  controllers: [AuthGoogleController],
  providers: [AuthGoogleService],
})
export class AuthGoogleModule {}
