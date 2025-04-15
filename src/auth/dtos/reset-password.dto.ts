import { IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'password required' })
  password: string;

  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'confirm password required' })
  confirmPassword: string;
}
