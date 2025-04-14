import { Exclude, Transform } from 'class-transformer';
import { Users } from '../../users/users.schema';

export class ResponsePatientContactsDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Exclude()
  patient: Users;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image ? `${baseUrl}/${value.image}` : undefined,
      phone: value?.phone,
    };
  })
  doctor: Users;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image ? `${baseUrl}/${value.image}` : undefined,
      phone: value?.phone,
    };
  })
  familyMember: Users;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  __v: number;

  constructor(partial: Partial<ResponsePatientContactsDto>) {
    Object.assign(this, partial);
  }
}
