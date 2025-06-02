import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Role, Roles } from '../common/decorators/roles.decorator';
import { EegModelService } from './eeg-model.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { createParseFilePipe } from '../common/files/files-validation-factory';
import { CustomRequest } from '../common/interfaces/custom-request.interface';

@Controller('api/v1/predict-eeg')
@Roles(Role.PATIENT, Role.FAMILY)
export class EegModelController {
  constructor(private readonly eegModelService: EegModelService) {}

  @Post()
  @UseInterceptors(FileInterceptor('eeg_file'))
  @HttpCode(HttpStatus.OK)
  async predictEeg(
    @Req() request: CustomRequest,
    @UploadedFile(createParseFilePipe('10MB', ['h5', 'edf']))
    eegFile: Express.Multer.File,
  ) {
    const prediction = await this.eegModelService.uploadEegFile(
      eegFile,
      request.user,
    );
    return prediction;
  }
}
