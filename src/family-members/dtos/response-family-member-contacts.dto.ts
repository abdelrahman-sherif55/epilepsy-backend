import { Exclude, Transform } from 'class-transformer';
import { Users } from '../../users/users.schema';
import { EegModel } from '../../eeg-model/eeg-model.schema';

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
    let predictionLastIndex: number = -1;
    let predictionTime: string = '';
    let IctalSeizures: any[] = [];
    let timeBetweenSeizures: string = 'only one seizure detected';
    let time: string = '';
    const result: { day: string; status: 'safe' | 'not safe' }[] = [];
    const today = new Date();
    let seizure = 0;
    let safe = 0;
    if (value?.predictionHistory?.length > 0) {
      predictionLastIndex = value?.predictionHistory?.length - 1;
      predictionTime = new Date(
        value?.predictionHistory[predictionLastIndex]?.time,
      ).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      IctalSeizures = [...value?.predictionHistory]
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
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);

      const formattedDay = date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const hasIctal = value?.predictionHistory?.some((prediction) => {
        const predictionDate = new Date(prediction.time);
        const formattedPredictionDate = predictionDate.toLocaleDateString(
          'en-GB',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          },
        );
        return (
          formattedPredictionDate === formattedDay &&
          prediction.prediction === 'Ictal'
        );
      });
      if (hasIctal) {
        seizure++;
      } else {
        safe++;
      }
      result.push({
        day: formattedDay,
        status: hasIctal ? 'not safe' : 'safe',
      });
    }
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
      predictionGraph:
        predictionLastIndex > -1
          ? {
              channels: value.predictionHistory[predictionLastIndex]?.channels,
              eeg_data: value.predictionHistory[predictionLastIndex]?.eeg_data,
              prediction:
                value.predictionHistory[predictionLastIndex]?.prediction,
              probabilities: {
                Ictal:
                  value.predictionHistory[predictionLastIndex]?.probabilities
                    ?.Ictal,
                NonIctal:
                  value.predictionHistory[predictionLastIndex]?.probabilities
                    ?.NonIctal,
                PreIctal:
                  value.predictionHistory[predictionLastIndex]?.probabilities
                    ?.PreIctal,
              },
              status: value.predictionHistory[predictionLastIndex]?.status,
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
      weeklySeizures: { week: result.reverse(), seizure, safe },
      doctor: {
        id: value?.doctor?._id.toString(),
        code: value?.doctor?.code,
        fullName: `${value?.doctor?.firstName} ${value?.doctor?.lastName}`,
        image: value?.doctor?.image
          ? `${baseUrl}/images/users/${value.doctor.image}`
          : undefined,
        email: value?.doctor?.email,
        phone: value?.doctor?.phone,
        gender: value?.doctor?.gender,
      },
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
