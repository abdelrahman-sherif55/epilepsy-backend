import { Exclude, Transform } from 'class-transformer';
import { UserDocument, Users } from '../../users/users.schema';
import { EegModel } from '../../eeg-model/eeg-model.schema';

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
      let predictionLastIndex: number = -1;
      let predictionTime: string = '';
      let IctalSeizures: any[] = [];
      let timeBetweenSeizures: string = 'only one seizure detected';
      let time: string = '';
      if (val?.predictionHistory?.length > 0) {
        predictionLastIndex = val?.predictionHistory?.length - 1;
        predictionTime = new Date(
          val?.predictionHistory[predictionLastIndex]?.time,
        ).toLocaleString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        IctalSeizures = [...val?.predictionHistory]
          .reverse()
          .filter((prediction) => prediction.prediction === 'Ictal');
        const lastSeizure: EegModel = IctalSeizures[0];
        time = new Date(lastSeizure.time).toLocaleString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
        if (IctalSeizures.length > 1) {
          const lastSeizureTime = new Date(lastSeizure.time);
          const previousSeizureTime = new Date(IctalSeizures[1].time);
          const diffMs: number = Math.abs(
            lastSeizureTime.getTime() - previousSeizureTime.getTime(),
          );
          const diffDays: number = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          timeBetweenSeizures = `${diffDays} day(s)`;
        }
      }
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
        predictionGraph:
          predictionLastIndex > -1
            ? {
                channels: val.predictionHistory[predictionLastIndex]?.channels,
                eeg_data: val.predictionHistory[predictionLastIndex]?.eeg_data,
                prediction:
                  val.predictionHistory[predictionLastIndex]?.prediction,
                probabilities: {
                  Ictal:
                    val.predictionHistory[predictionLastIndex]?.probabilities
                      ?.Ictal,
                  NonIctal:
                    val.predictionHistory[predictionLastIndex]?.probabilities
                      ?.NonIctal,
                  PreIctal:
                    val.predictionHistory[predictionLastIndex]?.probabilities
                      ?.PreIctal,
                },
                status: val.predictionHistory[predictionLastIndex]?.status,
                time: predictionTime,
              }
            : undefined,
        predictionSeizure:
          IctalSeizures.length > 0
            ? {
                lastSeizure: time,
                previousSeizures: IctalSeizures.length,
                timeBetweenSeizures: timeBetweenSeizures,
              }
            : undefined,
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
