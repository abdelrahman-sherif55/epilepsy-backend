import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { PatientsModule } from '../patients/patients.module';
import { FamilyMembersModule } from '../family-members/family-members.module';
import { DoctorsModule } from '../doctors/doctors.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    PatientsModule,
    FamilyMembersModule,
    DoctorsModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
