import { Exclude, Transform } from 'class-transformer';
import { Users } from '../../users/users.schema';

export class ResponsePatientDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    const date = new Date(value.dateOfBirth)
      .toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/');
    const dateOfBirth = [date[1], date[0], date[2]].join('/');
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image ? `${baseUrl}/${value.image}` : undefined,
      phone: value?.phone,
      dateOfBirth: dateOfBirth,
      weight: value?.weight,
    };
  })
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

  constructor(partial: Partial<ResponsePatientDto>) {
    Object.assign(this, partial);
  }
}
