import { IntersectionType, OmitType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { SignupDto } from '../../auth/dtos/signup.dto';

export class SignupGoogleDto extends IntersectionType(
  OmitType(SignupDto, ['password', 'confirmPassword'] as const),
) {
  @IsString({ message: 'google id required' })
  googleId: string;
}
