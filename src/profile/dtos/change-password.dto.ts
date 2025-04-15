import { IntersectionType, OmitType } from '@nestjs/mapped-types';
import { IsString, Length } from 'class-validator';
import { SignupDto } from '../../auth/dtos/signup.dto';

export class ChangePasswordDto extends IntersectionType(
  OmitType(SignupDto, [
    'type',
    'email',
    'dateOfBirth',
    'firstName',
    'lastName',
    'image',
    'phone',
    'weight',
  ] as const),
) {
  @Length(6, 20, { message: 'password length from 6 to 20' })
  @IsString({ message: 'current password required' })
  currentPassword: string;
}
