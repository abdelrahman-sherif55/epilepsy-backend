import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'invalid email' })
  @IsString({ message: 'email required' })
  email: string;

  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'password required' })
  password: string;
}
