import { IsEmail, IsString } from 'class-validator';

export class ForgetPasswordDto {
  @IsString({ message: 'invalid email' })
  @IsEmail({}, { message: 'invalid email' })
  email: string;
}
