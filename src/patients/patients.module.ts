import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patients, PatientsSchema } from './patients.schema';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import * as mongoose from 'mongoose';
import { DoctorsModule } from '../doctors/doctors.module';
import { FamilyMembersModule } from '../family-members/family-members.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Patients.name,
        useFactory: () => {
          const schema = PatientsSchema;
          schema.pre(/^find/, function () {
            const query = this as mongoose.Query<any, any>;
            query.populate({
              path: 'patient',
              select: 'code firstName lastName image phone dateOfBirth weight',
            });
            query.populate({
              path: 'doctor',
              select: 'code firstName lastName image phone',
            });
            query.populate({
              path: 'familyMember',
              select: 'code firstName lastName image phone',
            });
          });
          return schema;
        },
      },
    ]),
    forwardRef(() => DoctorsModule),
    forwardRef(() => FamilyMembersModule),
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [MongooseModule],
})
export class PatientsModule {}
