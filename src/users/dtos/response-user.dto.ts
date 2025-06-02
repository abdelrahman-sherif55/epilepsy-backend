import { Exclude, Expose, Transform } from 'class-transformer';
import { Role } from '../../common/decorators/roles.decorator';
import { EegModel } from '../../eeg-model/eeg-model.schema';

export class ResponseUserDto {
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

  @Transform(({ value }) => {
    return value.map((prediction: any) => ({
      channels: prediction?.channels,
      eeg_data: prediction?.eeg_data,
      prediction: prediction?.prediction,
      probabilities: {
        Ictal: prediction?.probabilities?.Ictal,
        NonIctal: prediction?.probabilities?.NonIctal,
        PreIctal: prediction?.probabilities?.PreIctal,
      },
      status: prediction?.status,
    }));
  })
  predictionHistory?: EegModel[];

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

  constructor(partial: Partial<ResponseUserDto>) {
    Object.assign(this, partial);
  }
}
