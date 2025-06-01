import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctors, DoctorsSchema } from './doctors.schema';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { PatientsModule } from '../patients/patients.module';
import * as mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Doctors.name,
        useFactory: () => {
          const schema = DoctorsSchema;
          schema.pre(/^find/, function () {
            const query = this as mongoose.Query<any, any>;
            query.populate({
              path: 'patients',
              select:
                'code firstName lastName gender email image phone dateOfBirth weight height',
            });
            query.populate({
              path: 'doctor',
              select: 'code firstName lastName gender image email phone',
            });
          });
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
