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

@Injectable()
export class ProfileService {
  private curd: Crud<UserDocument>;

  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<UserDocument>,
    private readonly createTokensService: CreateTokensService,
  ) {
    this.curd = new Crud<UserDocument>(usersModel, 'users');
  }

  public async getProfile(user: Users) {
    return { data: new ResponseUserDto(JSON.parse(JSON.stringify(user))) };
  }

  public async updateProfile(User: UserDocument, data: UpdateProfileDto) {
    const user: Users = await this.curd.updateOne(User._id, data);
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
