import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctors, DoctorsSchema } from './doctors.schema';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Doctors.name,
        useFactory: () => {
          const schema = DoctorsSchema;
          return schema;
        },
      },
    ]),
    forwardRef(() => PatientsModule),
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [MongooseModule],
})
export class DoctorsModule {}
