import { IsString } from 'class-validator';

export class AddPatientDto {
  @IsString({ message: 'Patient Code Required' })
  patient: string;
}
