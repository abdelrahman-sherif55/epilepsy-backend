import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyMembers, FamilyMembersSchema } from './family-members.schema';
import { FamilyMembersService } from './family-members.service';
import { FamilyMembersController } from './family-members.controller';
import { PatientsModule } from '../patients/patients.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: FamilyMembers.name,
        useFactory: () => {
          const schema = FamilyMembersSchema;
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
