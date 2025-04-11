import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'email required' })
  @IsEmail({}, { message: 'invalid email' })
  email: string;

  @IsString({ message: 'password required' })
  @Length(6, 20, { message: 'password length from 6 to 20' })
  password: string;
}
