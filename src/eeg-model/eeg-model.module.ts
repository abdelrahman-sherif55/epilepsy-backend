import { Module } from '@nestjs/common';
import { EegModelController } from './eeg-model.controller';
import { EegModelService } from './eeg-model.service';
import { HttpModule } from '@nestjs/axios';
import { PatientsModule } from '../patients/patients.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HttpModule, UsersModule, PatientsModule, NotificationsModule],
  controllers: [EegModelController],
  providers: [EegModelService],
})
export class EegModelModule {}
