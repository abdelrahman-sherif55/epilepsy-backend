import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '../common/decorators/public.decorator';
import { AuthGoogleService } from './auth-google.service';
import { SignupGoogleDto } from './dtos/signup-google.dto';
import {
  createParseFilePipe,
  generateFileName,
} from '../common/files/files-validation-factory';
import { FilePath } from '../common/files/constants/file-count.constants';
import { LoginGoogleDto } from './dtos/login-google.dto';

@Controller('api/v1/auth-google')
@Public()
export class AuthGoogleController {
  constructor(private readonly authGoogleService: AuthGoogleService) {}

  @Post('signup')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async signup(
    @Body() data: SignupGoogleDto,
    @UploadedFile(createParseFilePipe('10MB', ['jpg', 'jpeg', 'png', 'webp']))
    image: Express.Multer.File,
  ) {
    if (image) data.image = generateFileName(image, FilePath.USERS);
    return await this.authGoogleService.signup(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginGoogleDto) {
    return await this.authGoogleService.login(data);
  }
}
