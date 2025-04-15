import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyMembers, FamilyMembersSchema } from './family-members.schema';
import { FamilyMembersService } from './family-members.service';
import { FamilyMembersController } from './family-members.controller';
import { PatientsModule } from '../patients/patients.module';
import * as mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: FamilyMembers.name,
        useFactory: () => {
          const schema = FamilyMembersSchema;
          schema.pre(/^find/, function () {
            const query = this as mongoose.Query<any, any>;
            query.populate({
              path: 'patient',
              select: 'code firstName lastName image phone dateOfBirth weight',
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
    forwardRef(() => PatientsModule),
  ],
  controllers: [FamilyMembersController],
  providers: [FamilyMembersService],
  exports: [MongooseModule],
})
export class FamilyMembersModule {}
