import { Exclude, Transform } from 'class-transformer';
import { UserDocument, Users } from '../../users/users.schema';

export class ResponseDoctorDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return value.map((val: UserDocument) => {
      const dateOfBirth: string = new Date(val.dateOfBirth).toLocaleString(
        'en-GB',
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        },
      );
      return {
        id: val?._id,
        code: val?.code,
        fullName: `${val?.firstName} ${val?.lastName}`,
        image: val?.image ? `${baseUrl}/images/users/${val.image}` : undefined,
        gender: val?.gender,
        email: val?.email,
        phone: val?.phone,
        dateOfBirth: dateOfBirth,
        weight: val?.weight,
        height: val?.height,
      };
    });
  })
  patients: Users[];

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return {
      id: value?._id,
      code: value?.code,
      fullName: `${value?.firstName} ${value?.lastName}`,
      image: value?.image
        ? `${baseUrl}/images/users/${value.image}`
        : undefined,
      gender: value?.gender,
      phone: value?.phone,
      email: value?.email,
    };
  })
  doctor: Users;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  __v: number;

  constructor(partial: Partial<ResponseDoctorDto>) {
    Object.assign(this, partial);
  }
}
