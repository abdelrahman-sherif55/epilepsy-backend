import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../common/decorators/roles.decorator';
import { Gender } from './gender.enum';

@Schema({ timestamps: true })
export class Users {
  @Prop()
  code: string;

  @Prop()
  googleId: string;

  @Prop()
  deviceId: string;

  @Prop()
  email: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  image: string;

  @Prop()
  phone: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: ['patient', 'family', 'doctor'] })
  type: Role;

  @Prop({ enum: ['male', 'female'] })
  gender: Gender;

  @Prop()
  weight: number;

  @Prop()
  height: number;

  @Prop()
  password: string;

  @Prop()
  passwordChangedAt: Date;

  @Prop()
  passwordResetCode: string;

  @Prop()
  passwordResetCodeExpires: Date;

  @Prop()
  passwordResetCodeVerify: boolean;
}

export type UserDocument = HydratedDocument<Users>;
export const UsersSchema = SchemaFactory.createForClass(Users);
