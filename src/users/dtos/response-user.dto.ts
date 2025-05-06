import { Exclude, Expose, Transform } from 'class-transformer';
import { Role } from '../../common/decorators/roles.decorator';

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
    const date = new Date(value)
      .toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .split('/');
    return [date[1], date[0], date[2]].join('/');
  })
  dateOfBirth: Date;

  type: Role;

  weight: number;

  height: number;

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
