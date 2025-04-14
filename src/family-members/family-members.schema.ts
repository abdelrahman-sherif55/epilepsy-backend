import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';
import { Users } from '../users/users.schema';

@Schema({ timestamps: true, id: false })
export class FamilyMembers {
  @Prop()
  code: string;

  @Prop()
  name: string;

  @Prop({ type: schema.Types.ObjectId, ref: Users.name })
  familyMember: Users;

  @Prop({ type: schema.Types.ObjectId, ref: Users.name })
  patient: Users;
}

export type FamilyMemberDocument = HydratedDocument<FamilyMembers>;
export const FamilyMembersSchema = SchemaFactory.createForClass(FamilyMembers);
