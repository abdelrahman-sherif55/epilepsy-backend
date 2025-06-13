import { Exclude, Expose, Transform } from 'class-transformer';
import { Role } from '../../common/decorators/roles.decorator';
import { EegModel } from '../../eeg-model/eeg-model.schema';

export class ResponseProfileDto {
  @Expose({ name: 'id' })
  _id: string;

  code: string;

  email: string;

  firstName: string;

  lastName: string;

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Transform(({ value }) => {
    const baseUrl: string = process.env.BASE_URL;
    return `${baseUrl}/images/users/${value}`;
  })
  image: string;

  phone: string;

  @Transform(({ value }) => {
    return new Date(value).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  })
  dateOfBirth: Date;

  type: Role;

  weight: number;

  height: number;

  // @Transform(({ value }) => {
  //   return value.map((prediction: any) => ({
  //     channels: prediction?.channels,
  //     eeg_data: prediction?.eeg_data,
  //     prediction: prediction?.prediction,
  //     probabilities: {
  //       Ictal: prediction?.probabilities?.Ictal,
  //       NonIctal: prediction?.probabilities?.NonIctal,
  //       PreIctal: prediction?.probabilities?.PreIctal,
  //     },
  //     status: prediction?.status,
  //   }));
  // })
  @Exclude()
  predictionHistory?: EegModel[];

  @Expose()
  get predictionGraph(): any {
    if (this.predictionHistory && this.predictionHistory.length > 0) {
      const lastIndex: number = this.predictionHistory.length - 1;
      const time: string = new Date(
        this.predictionHistory[lastIndex].time,
      ).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return {
        channels: this.predictionHistory[lastIndex].channels,
        eeg_data: this.predictionHistory[lastIndex].eeg_data,
        prediction: this.predictionHistory[lastIndex].prediction,
        probabilities: {
          Ictal: this.predictionHistory[lastIndex].probabilities?.Ictal,
          NonIctal: this.predictionHistory[lastIndex].probabilities?.NonIctal,
          PreIctal: this.predictionHistory[lastIndex].probabilities?.PreIctal,
        },
        status: this.predictionHistory[lastIndex].status,
        time: time,
      };
    }
    return undefined;
  }

  @Expose()
  get predictionSeizure(): any {
    if (this.predictionHistory && this.predictionHistory.length > 0) {
      const IctalSeizures: EegModel[] = [...this.predictionHistory]
        .reverse()
        .filter((prediction) => prediction.prediction === 'Ictal');
      if (IctalSeizures.length === 0)
        return {
          lastSeizure: 'No seizures detected',
          previousSeizures: 0,
          timeBetweenSeizures: 'N/A',
        };
      const lastSeizure: EegModel = IctalSeizures[0];
      const time: string = new Date(lastSeizure.time).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      let timeBetweenSeizures: string = 'only one seizure detected';
      if (IctalSeizures.length > 1) {
        const lastSeizureTime = new Date(lastSeizure.time);
        const previousSeizureTime = new Date(IctalSeizures[1].time);
        const diffMs: number = Math.abs(
          lastSeizureTime.getTime() - previousSeizureTime.getTime(),
        );
        const diffDays: number = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        timeBetweenSeizures = `${diffDays} day(s)`;
      }
      return {
        lastSeizure: time,
        previousSeizures: IctalSeizures.length,
        timeBetweenSeizures: timeBetweenSeizures,
      };
    }
    return undefined;
  }

  @Expose()
  get weeklySeizures(): any {
    if (this.predictionHistory && this.predictionHistory.length > 0) {
      const result: { day: string; status: 'safe' | 'not safe' }[] = [];

      const today = new Date();
      let seizure = 0;
      let safe = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const formattedDay = date.toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        const hasIctal = this.predictionHistory?.some((prediction) => {
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

      return { week: result.reverse(), seizure, safe };
    }
    return undefined;
  }

  @Exclude()
  googleId: string;

  @Exclude()
  password: string;

  @Exclude()
  passwordChangedAt: Date;

  @Exclude()
  passwordResetCode: string;

  @Exclude()
  passwordResetCodeExpires: Date;

  @Exclude()
  passwordResetCodeVerify: boolean;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  __v: number;

  constructor(partial: Partial<ResponseProfileDto>) {
    Object.assign(this, partial);
  }
}
