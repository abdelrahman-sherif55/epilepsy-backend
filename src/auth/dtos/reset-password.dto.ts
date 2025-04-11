import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'password required' })
  @Length(6, 20, { message: 'password length from 6 to 20' })
  password: string;

  @IsString({ message: 'confirm password required' })
  @Length(6, 20, { message: 'password length from 6 to 20' })
  confirmPassword: string;
}
