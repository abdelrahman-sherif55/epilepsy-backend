import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as FormData from 'form-data';
import { InjectModel } from '@nestjs/mongoose';
import { Patients } from '../patients/patients.schema';
import { Model } from 'mongoose';
import { UserDocument, Users } from '../users/users.schema';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../common/interfaces/environment.interface';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EegModelService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<Environment>,
    private readonly notificationsService: NotificationsService,
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(Users.name) private readonly usersModel: Model<Users>,
  ) {}

  public async uploadEegFile(eegFile: Express.Multer.File, user: UserDocument) {
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
    let patient: Patients;
    let patientUser: UserDocument = user;
    if (user.type === 'patient') {
      patient = await this.patientsModel.findOneAndUpdate(
        { code: user.code },
        { $addToSet: { predictionHistory: model } },
      );
    } else {
      patient = await this.patientsModel.findOneAndUpdate(
        { familyMembers: user._id },
        { $addToSet: { predictionHistory: model } },
      );
      patientUser = await this.usersModel.findOne({ code: patient.code });
    }
    if (model.prediction !== 'Non-Ictal') {
      const devicesIds: string[] = [];
      if (patient.doctor) {
        const doctorPatient: Users = await this.usersModel.findOne({
          code: patient.doctor.code,
        });
        devicesIds.push(doctorPatient.deviceId);
      }
      if (patient.familyMembers.length > 0) {
        const familyMembers = await this.usersModel.find({
          code: { $in: patient.familyMembers.map((member) => member.code) },
        });
        familyMembers.forEach((member) => {
          devicesIds.push(member.deviceId);
        });
      }
      const notificationTitle = 'Warning';
      let notificationPatientMessage = '';
      let notificationDoctorMessage = '';
      if (model.prediction === 'Pre-ictal') {
        notificationPatientMessage =
          'You are in a pre-ictal state. Please take precautions.';
        notificationDoctorMessage = `Patient ${patient.name} is in a pre-ictal state. Please monitor closely.`;
      } else if (model.prediction === 'Ictal') {
        notificationPatientMessage =
          'You are in an ictal state. Please seek immediate medical attention.';
        notificationDoctorMessage = `Patient ${patient.name} is in an ictal state. Immediate action is required.`;
      }
      if (devicesIds.length > 0) {
        await this.notificationsService.sendNotification(
          devicesIds,
          notificationTitle,
          notificationDoctorMessage,
        );
      }
      await this.notificationsService.sendNotification(
        [patientUser.deviceId],
        notificationTitle,
        notificationPatientMessage,
      );
    }
    return { data: model };
  }
}

// Pre-ictal, Ictal, Non-Ictal
