import { Module } from '@nestjs/common';
import { EegModelController } from './eeg-model.controller';
import { EegModelService } from './eeg-model.service';
import { HttpModule } from '@nestjs/axios';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [HttpModule, PatientsModule],
  controllers: [EegModelController],
  providers: [EegModelService],
})
export class EegModelModule {}
