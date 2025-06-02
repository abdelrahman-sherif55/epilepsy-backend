import { Exclude, Transform } from 'class-transformer';
import { UserDocument, Users } from '../../users/users.schema';

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
      image: value?.image
        ? `${baseUrl}/images/users/${value.image}`
        : undefined,
      gender: value.gender,
      phone: value?.phone,
      email: value?.email,
    };
  })
  doctor: Users;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return value.map((val: UserDocument) => ({
      id: val?._id,
      code: val?.code,
      fullName: `${val?.firstName} ${val?.lastName}`,
      image: val?.image ? `${baseUrl}/images/users/${val.image}` : undefined,
      gender: val.gender,
      phone: val?.phone,
      email: val?.email,
    }));
  })
  familyMembers: Users[];

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
