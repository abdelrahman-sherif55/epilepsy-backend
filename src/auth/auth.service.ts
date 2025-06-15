import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserDocument, Users } from '../users/users.schema';
import { CreateTokensService } from './create-tokens.service';
import { MailService } from '../mail/mail.service';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { ResponseUserDto } from '../users/dtos/response-user.dto';
import { GenerateCode } from '../common/classes/generate-code';
import { Patients } from '../patients/patients.schema';
import { FamilyMembers } from '../family-members/family-members.schema';
import { Doctors } from '../doctors/doctors.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<Users>,
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(FamilyMembers.name)
    private readonly familyMembersModel: Model<FamilyMembers>,
    @InjectModel(Doctors.name) private readonly doctorsModel: Model<Doctors>,
    private readonly createTokensService: CreateTokensService,
    private readonly mailService: MailService,
    private readonly codes: GenerateCode,
  ) {}

  public async signup(data: SignupDto) {
    if (data.password !== data.confirmPassword)
      throw new BadRequestException("password doesn't match");
    const checkUser: Users = await this.usersModel.findOne({
      email: data.email,
    });
    if (checkUser) throw new BadRequestException('email is already exist');
    const createdData = {
      ...data,
      code: await this.codes.generateUniqueCode(this.usersModel),
    };
    const user: UserDocument = await this.usersModel.create(createdData);
    await this.createUserRole(createdData, user);
    const accessToken: string = this.createTokensService.AccessToken(user._id);
    return {
      accessToken,
      data: new ResponseUserDto(JSON.parse(JSON.stringify(user, null, 2))),
    };
  }

  public async createUserRole(data: any, user: UserDocument) {
    if (user.type === 'patient') {
      await this.patientsModel.create({
        code: data.code,
        name: `${data.firstName} ${data.lastName}`,
        patient: user._id,
      });
    } else if (user.type === 'family') {
      await this.familyMembersModel.create({
        code: data.code,
        name: `${data.firstName} ${data.lastName}`,
        familyMember: user._id,
      });
    } else {
      await this.doctorsModel.create({
        code: data.code,
        name: `${data.firstName} ${data.lastName}`,
        doctor: user._id,
      });
    }
  }

  public async login(data: LoginDto) {
    const user: UserDocument = await this.usersModel.findOne({
      email: data.email,
    });
    if (
      !user ||
      !user.password ||
      !(await bcrypt.compare(data.password, user.password))
    )
      throw new BadRequestException('invalid email or password');
    user.deviceId = data.deviceId;
    await user.save();
    const accessToken: string = this.createTokensService.AccessToken(user._id);
    return {
      accessToken,
      data: new ResponseUserDto(JSON.parse(JSON.stringify(user, null, 2))),
    };
  }

  public async forgetPassword(data: ForgetPasswordDto) {
    const user: UserDocument = await this.usersModel.findOne({
      email: data.email,
    });
    if (!user) throw new BadRequestException('invalid email');

    const resetCode: string = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    user.passwordResetCode = crypto
      .createHash('sha256')
      .update(resetCode)
      .digest('hex');
    user.passwordResetCodeExpires = new Date(Date.now() + 30 * 60 * 1000);
    user.passwordResetCodeVerify = false;

    try {
      await this.mailService.sendMail(user.email, 'Reset Password', resetCode);
      await user.save({ validateModifiedOnly: true });
    } catch (err) {
      console.log(err);
      throw new InternalServerErrorException('try again later');
    }
    const token: string = this.createTokensService.ForgetPasswordToken(
      user._id,
    );
    return { message: 'check your email', resetToken: token };
  }

  public async verifyCode(decodedToken: any, data: VerifyCodeDto) {
    const hashedResetCode: string = crypto
      .createHash('sha256')
      .update(data.resetCode)
      .digest('hex');
    const user = await this.usersModel.findOne({
      _id: decodedToken.id,
      passwordResetCode: hashedResetCode,
      passwordResetCodeExpires: { $gt: Date.now() },
    });
    if (!user) throw new BadRequestException('invalid or expired code');
    user.passwordResetCodeVerify = true;
    await user.save({ validateModifiedOnly: true });
    return { message: 'code verified' };
  }

  public async resetPassword(decodedToken: any, data: ResetPasswordDto) {
    if (data.password !== data.confirmPassword)
      throw new BadRequestException("password doesn't match");
    const user = await this.usersModel.findOne({
      _id: decodedToken.id,
      passwordResetCodeVerify: true,
    });
    if (!user) throw new ForbiddenException("you can't change password");
    user.password = data.password;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    user.passwordResetCodeVerify = undefined;
    user.passwordChangedAt = new Date(Date.now());
    await user.save({ validateModifiedOnly: true });
    return { message: 'password changed successfully' };
  }
}
