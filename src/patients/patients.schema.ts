import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';
import { Users } from '../users/users.schema';

@Schema({ timestamps: true, id: false })
export class Patients {
  @Prop()
  code: string;

  @Prop()
  name: string;

  @Prop({ type: schema.Types.ObjectId, ref: Users.name })
  patient: Users;

  @Prop({ type: schema.Types.ObjectId, ref: Users.name })
  doctor: Users;

  @Prop([{ type: schema.Types.ObjectId, ref: Users.name }])
  familyMembers: Users[];
}

export type PatientDocument = HydratedDocument<Patients>;
export const PatientsSchema = SchemaFactory.createForClass(Patients);
