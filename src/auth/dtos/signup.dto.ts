import {
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { Gender } from '../../users/gender.enum';

enum UsersType {
  PATIENT = 'patient',
  FAMILY = 'family',
  DOCTOR = 'doctor',
}

export class SignupDto {
  @IsString({ message: 'device id required' })
  deviceId: string;

  @IsEmail({}, { message: 'invalid email' })
  @IsString({ message: 'email required' })
  email: string;

  @IsString({ message: 'first name required' })
  firstName: string;

  @IsString({ message: 'last name required' })
  lastName: string;

  @IsOptional()
  image: string;

  @IsMobilePhone('ar-EG', {}, { message: 'invalid Egyptian phone number' })
  phone: string;

  @IsOptional()
  dateOfBirth: Date;

  @IsEnum(UsersType, { message: 'invalid user type' })
  @IsString({ message: 'user type required' })
  type: UsersType;

  @IsEnum(Gender, { message: 'invalid gender' })
  @IsString({ message: 'user gender required' })
  gender: Gender;

  @IsOptional()
  weight: number;

  @IsOptional()
  height: number;

  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'password required' })
  password: string;

  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'confirm password required' })
  confirmPassword: string;
}
