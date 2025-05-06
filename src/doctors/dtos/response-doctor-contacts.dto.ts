import { Exclude, Transform } from 'class-transformer';
import { UserDocument, Users } from '../../users/users.schema';

export class ResponseDoctorContactsDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Exclude()
  doctor: Users;

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return value.map((val: UserDocument) => {
      const date = new Date(val.dateOfBirth)
        .toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .split('/');
      const dateOfBirth = [date[1], date[0], date[2]].join('/');
      return {
        id: val?._id,
        code: val?.code,
        fullName: `${val?.firstName} ${val?.lastName}`,
        image: val?.image ? `${baseUrl}/${val.image}` : undefined,
        phone: val?.phone,
        dateOfBirth: dateOfBirth,
        weight: val?.weight,
        height: val?.height,
      };
    });
  })
  patients: Users[];

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  __v: number;

  constructor(partial: Partial<ResponseDoctorContactsDto>) {
    Object.assign(this, partial);
  }
}
