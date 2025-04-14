import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as schema } from 'mongoose';
import { Users } from '../users/users.schema';

@Schema({ timestamps: true, id: false })
export class Doctors {
  @Prop()
  code: string;

  @Prop()
  name: string;

  @Prop({ type: schema.Types.ObjectId, ref: Users.name })
  doctor: Users;

  @Prop([{ type: schema.Types.ObjectId, ref: Users.name }])
  patients: Users[];
}

export type DoctorDocument = HydratedDocument<Doctors>;
export const DoctorsSchema = SchemaFactory.createForClass(Doctors);
