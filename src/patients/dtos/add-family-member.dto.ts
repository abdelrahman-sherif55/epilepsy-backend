import { IsString } from 'class-validator';

export class AddFamilyMemberDto {
  @IsString({ message: 'Family Member Code Required' })
  familyMember: string;
}
