import { Exclude, Transform } from 'class-transformer';
import { Users } from '../../users/users.schema';

export class ResponseFamilyMemberContactsDto {
  @Exclude()
  _id: string;

  @Exclude()
  code: string;

  @Exclude()
  name: string;

  @Exclude()
  familyMember: Users;

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
      gender: value?.gender,
      email: value?.email,
      phone: value?.phone,
      dateOfBirth: dateOfBirth,
      weight: value?.weight,
      height: value?.height,
      predictionHistory: value?.predictionHistory.map((prediction: any) => ({
        channels: prediction?.channels,
        eeg_data: prediction?.eeg_data,
        prediction: prediction?.prediction,
        probabilities: {
          Ictal: prediction?.probabilities?.Ictal,
          NonIctal: prediction?.probabilities?.NonIctal,
          PreIctal: prediction?.probabilities?.PreIctal,
        },
        status: prediction?.status,
      })),
    };
  })
  patient: Users;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  __v: number;

  constructor(partial: Partial<ResponseFamilyMemberContactsDto>) {
    Object.assign(this, partial);
  }
}
