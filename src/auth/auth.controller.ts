import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dtos/signup.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgetPasswordDto } from './dtos/forget-password.dto';
import { VerifyCodeDto } from './dtos/verify-code.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { Public } from '../common/decorators/public.decorator';
import { CustomRequest } from '../common/interfaces/custom-request.interface';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  async signup(
    @Body() data: SignupDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return await this.authService.signup(data);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  async forgetPassword(@Body() data: ForgetPasswordDto) {
    return await this.authService.forgetPassword(data);
  }

  @Post('verify-code')
  @UseGuards(ResetPasswordGuard)
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Req() request: CustomRequest, @Body() data: VerifyCodeDto) {
    return await this.authService.verifyCode(request.decodedToken, data);
  }

  @Patch('reset-password')
  @UseGuards(ResetPasswordGuard)
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Req() request: CustomRequest,
    @Body() data: ResetPasswordDto,
  ) {
    return await this.authService.resetPassword(request.decodedToken, data);
  }
}
