import { Exclude, Expose, Transform } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../../common/interfaces/environment.interface';
import { Role } from '../../common/decorators/roles.decorator';

export class ResponseUserDto {
  static configService: ConfigService<Environment>;
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
    const baseUrl: string = ResponseUserDto.configService.get('BASE_URL', {
      infer: true,
    });
    return `${baseUrl}/${value}`;
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
