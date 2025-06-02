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
    return value.map((val: any) => {
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
        image: val?.image ? `${baseUrl}/${val.image}` : undefined,
        gender: val?.gender,
        email: val?.email,
        phone: val?.phone,
        dateOfBirth: dateOfBirth,
        weight: val?.weight,
        height: val?.height,
        predictionHistory: val?.predictionHistory.map((prediction: any) => ({
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
        familyMembers: val?.familyMembers.map((familyMember: UserDocument) => ({
          id: familyMember?._id.toString(),
          code: familyMember?.code,
          fullName: `${familyMember?.firstName} ${familyMember?.lastName}`,
          image: familyMember?.image
            ? `${baseUrl}/${familyMember.image}`
            : undefined,
          gender: familyMember?.gender,
          phone: familyMember?.phone,
          email: familyMember?.email,
        })),
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
