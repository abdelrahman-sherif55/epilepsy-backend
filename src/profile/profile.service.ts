import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Crud } from '../common/classes/crud';
import { UserDocument, Users } from '../users/users.schema';
import { CreateTokensService } from '../auth/create-tokens.service';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ResponseUserDto } from '../users/dtos/response-user.dto';
import { Patients } from '../patients/patients.schema';
import { FamilyMembers } from '../family-members/family-members.schema';
import { Doctors } from '../doctors/doctors.schema';
import { deleteFile } from '../common/files/files-validation-factory';
import { FilePath } from '../common/files/constants/file-count.constants';

@Injectable()
export class ProfileService {
  private curd: Crud<UserDocument>;

  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<UserDocument>,
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(FamilyMembers.name)
    private readonly familyMembersModel: Model<FamilyMembers>,
    @InjectModel(Doctors.name) private readonly doctorsModel: Model<Doctors>,
    private readonly createTokensService: CreateTokensService,
  ) {
    this.curd = new Crud<UserDocument>(usersModel, 'users');
  }

  public async getProfile(user: Users) {
    const data: any = JSON.parse(JSON.stringify(user));
    if (user.type === 'patient') {
      const patient: Patients = await this.patientsModel.findOne({
        code: user.code,
      });
      data.predictionHistory = patient.predictionHistory;
    }
    return { data: new ResponseUserDto(data) };
  }

  public async updateProfile(User: UserDocument, data: UpdateProfileDto) {
    let user: Users = await this.curd.getOne(User._id);
    if (data.image) deleteFile(`${FilePath.USERS}/${user.image}`);
    user = await this.curd.updateOne(User._id, data);
    if (user.type === 'patient') {
      await this.patientsModel.updateOne(
        { code: user.code },
        { name: `${user.firstName} ${user.lastName}` },
      );
    } else if (user.type === 'family') {
      await this.familyMembersModel.updateOne(
        { code: user.code },
        { name: `${user.firstName} ${user.lastName}` },
      );
    } else {
      await this.doctorsModel.updateOne(
        { code: user.code },
        { name: `${user.firstName} ${user.lastName}` },
      );
    }
    return {
      message: 'profile updated',
      data: new ResponseUserDto(user),
    };
  }

  public async changePassword(User: UserDocument, data: ChangePasswordDto) {
    if (!(await bcrypt.compare(data.currentPassword, User.password)))
      throw new BadRequestException('current password is incorrect');
    if (data.password !== data.confirmPassword)
      throw new BadRequestException("password doesn't match");
    const updatedData = {
      password: await bcrypt.hash(data.password, 15),
      passwordChangedAt: Date.now(),
    };
    const user: UserDocument = await this.curd.updateOne(User._id, updatedData);
    const accessToken: string = this.createTokensService.AccessToken(user._id);
    return {
      message: 'password changed successfully',
      accessToken,
      data: new ResponseUserDto(user as Users),
    };
  }
}
