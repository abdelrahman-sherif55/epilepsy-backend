import { IsString } from 'class-validator';

export class LoginGoogleDto {
  @IsString({ message: 'google id required' })
  googleId: string;
}
