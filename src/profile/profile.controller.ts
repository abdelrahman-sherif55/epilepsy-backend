import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CustomRequest } from '../common/interfaces/custom-request.interface';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createParseFilePipe,
  generateFileName,
} from '../common/files/files-validation-factory';
import { FilePath } from '../common/files/constants/file-count.constants';

@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() request: CustomRequest) {
    return await this.profileService.getProfile(request.user);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('image'))
  async updateProfile(
    @Req() request: CustomRequest,
    @Body() data: UpdateProfileDto,
    @UploadedFile(createParseFilePipe('10MB', ['jpg', 'jpeg', 'png', 'webp']))
    image: Express.Multer.File,
  ) {
    if (image) data.image = generateFileName(image, FilePath.USERS);
    return await this.profileService.updateProfile(request.user, data);
  }

  @Patch('change-password')
  async changePassword(
    @Req() request: CustomRequest,
    @Body() data: ChangePasswordDto,
  ) {
    return await this.profileService.changePassword(request.user, data);
  }
}
