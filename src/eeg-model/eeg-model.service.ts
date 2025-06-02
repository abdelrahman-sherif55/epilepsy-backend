import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { InjectModel } from '@nestjs/mongoose';
import { Patients } from '../patients/patients.schema';
import { Model } from 'mongoose';
import { Users } from '../users/users.schema';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../common/interfaces/environment.interface';

@Injectable()
export class EegModelService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Environment>,
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
  ) {}

  public async uploadEegFile(eegFile: Express.Multer.File, user: Users) {
    if (!eegFile) {
      throw new BadRequestException('No EEG file provided');
    }
    const form = new FormData();
    form.append('eeg_file', eegFile.buffer, {
      filename: eegFile.originalname,
      contentType: eegFile.mimetype,
    });
    const headers = form.getHeaders();

    const res$ = this.httpService.post(
      this.configService.get('EEG_MODEL_URL', { infer: true }),
      form,
      { headers },
    );
    const response = await firstValueFrom(res$);
    const model = {
      channels: response.data.channels,
      eeg_data: response.data.eeg_data,
      prediction: response.data.prediction,
      probabilities: {
        Ictal: response.data.probabilities.Ictal,
        NonIctal: response.data.probabilities['Non-Ictal'],
        PreIctal: response.data.probabilities['Pre-ictal'],
      },
      status: response.data.status,
    };
    await this.patientsModel.findOneAndUpdate(
      { code: user.code },
      { $addToSet: { predictionHistory: model } },
    );
    return { data: model };
  }
}
