import { Module } from '@nestjs/common';
import { MongoModule } from './mongo/mongo.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { FamilyMembersModule } from './family-members/family-members.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AuthGoogleModule } from './auth-google/auth-google.module';
import { EegModelModule } from './eeg-model/eeg-model.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'development'
          ? 'development.env'
          : 'production.env',
      isGlobal: true,
      expandVariables: true,
    }),
    MongoModule,
    CommonModule,
    MailModule,
    AuthModule,
    AuthGoogleModule,
    ProfileModule,
    UsersModule,
    PatientsModule,
    FamilyMembersModule,
    DoctorsModule,
    EegModelModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
