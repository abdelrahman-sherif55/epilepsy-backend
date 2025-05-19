import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument, Users } from '../users/users.schema';
import { Model } from 'mongoose';
import { CreateTokensService } from '../auth/create-tokens.service';
import { GenerateCode } from '../common/classes/generate-code';
import { SignupGoogleDto } from './dtos/signup-google.dto';
import { LoginGoogleDto } from './dtos/login-google.dto';
import { AuthService } from '../auth/auth.service';
import { ResponseUserDto } from '../users/dtos/response-user.dto';

@Injectable()
export class AuthGoogleService {
  constructor(
    @InjectModel(Users.name) private readonly usersModel: Model<Users>,
    private readonly authService: AuthService,
    private readonly createTokensService: CreateTokensService,
    private readonly codes: GenerateCode,
  ) {}

  public async signup(data: SignupGoogleDto) {
    let user: UserDocument = await this.usersModel.findOne({
      googleId: data.googleId,
    });
    if (user) throw new BadRequestException('user already exist please login');
    user = await this.usersModel.findOne({ email: data.email });
    if (user) {
      user.googleId = data.googleId;
      await user.save();
    } else {
      const createdData = {
        ...data,
        code: await this.codes.generateUniqueCode(this.usersModel),
      };
      user = await this.usersModel.create(createdData);
      await this.authService.createUserRole(createdData, user);
    }
    const accessToken: string = this.createTokensService.AccessToken(user._id);
    return {
      accessToken,
      data: new ResponseUserDto(JSON.parse(JSON.stringify(user, null, 2))),
    };
  }

  public async login(data: LoginGoogleDto) {
    const user: UserDocument = await this.usersModel.findOne({
      googleId: data.googleId,
    });
    if (!user) throw new BadRequestException('user not found please signup');
    const accessToken: string = this.createTokensService.AccessToken(user._id);
    return {
      accessToken,
      data: new ResponseUserDto(JSON.parse(JSON.stringify(user, null, 2))),
    };
  }
}
