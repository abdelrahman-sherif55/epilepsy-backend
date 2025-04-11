import { IsString, Length } from 'class-validator';

export class VerifyCodeDto {
  @IsString({ message: 'reset code required' })
  @Length(6, 6, { message: 'invalid code' })
  resetCode: string;
}
