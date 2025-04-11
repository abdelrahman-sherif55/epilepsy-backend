import { OmitType, PartialType } from '@nestjs/mapped-types';
import { SignupDto } from '../../auth/dtos/signup.dto';

export class UpdateProfileDto extends PartialType(
  OmitType(SignupDto, [
    'type',
    'email',
    'password',
    'confirmPassword',
  ] as const),
) {}
