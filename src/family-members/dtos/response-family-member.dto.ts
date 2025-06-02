import { Exclude, Transform } from 'class-transformer';
import { Users } from '../../users/users.schema';

export class ResponseFamilyMemberDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    const dateOfBirth = new Date(value.dateOfBirth).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image
        ? `${baseUrl}/images/users/${value.image}`
        : undefined,
      phone: value?.phone,
      dateOfBirth: dateOfBirth,
      weight: value?.weight,
      height: value?.height,
    };
  })
  patient: Users;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image
        ? `${baseUrl}/images/users/${value.image}`
        : undefined,
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

  constructor(partial: Partial<ResponseFamilyMemberDto>) {
    Object.assign(this, partial);
  }
}
