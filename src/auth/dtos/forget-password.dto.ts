import { IsEmail, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail({}, { message: 'invalid email' })
  @IsString({ message: 'email required' })
  email: string;
}
