import {
  IsEmail,
  IsEnum,
  IsMobilePhone,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

enum UsersType {
  PATIENT = 'patient',
  FAMILY = 'family',
  DOCTOR = 'doctor',
}

export class SignupDto {
  @IsString({ message: 'email required' })
  @IsEmail({}, { message: 'invalid email' })
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

  @IsString({ message: 'user type required' })
  @IsEnum(UsersType, { message: 'invalid user type' })
  type: UsersType;

  @IsOptional()
  weight: number;

  @IsString({ message: 'password required' })
  @Length(6, 20, { message: 'password length from 6 to 20' })
  password: string;

  @IsString({ message: 'confirm password required' })
  @Length(6, 20, { message: 'password length from 6 to 20' })
  confirmPassword: string;
}
