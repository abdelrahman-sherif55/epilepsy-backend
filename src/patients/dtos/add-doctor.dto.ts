import { IsString } from 'class-validator';

export class AddDoctorDto {
  @IsString({ message: 'Doctor Code Required' })
  doctor: string;
}
