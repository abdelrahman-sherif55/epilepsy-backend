import { BadRequestException, Injectable } from '@nestjs/common';
import { Crud } from '../common/classes/crud';
import { InjectModel } from '@nestjs/mongoose';
import { PatientDocument, Patients } from '../patients/patients.schema';
import { Model } from 'mongoose';
import { DoctorDocument, Doctors } from './doctors.schema';
import { Users } from '../users/users.schema';
import { ResponseDoctorDto } from './dtos/response-doctor.dto';
import { ResponseDoctorContactsDto } from './dtos/response-doctor-contacts.dto';
import { AddPatientDto } from '../family-members/dtos/add-patient.dto';

@Injectable()
export class DoctorsService {
  private crud: Crud<Doctors>;

  constructor(
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(Doctors.name)
    private readonly doctorsModel: Model<Doctors>,
  ) {
    this.crud = new Crud<Doctors>(this.doctorsModel, 'doctors');
  }

  public async getAll(query: any) {
    const doctors = await this.crud.getAll(query);
    return {
      ...doctors,
      data: doctors.data.map(
        (doctor: Doctors) => new ResponseDoctorDto(doctor),
      ),
    };
  }

  public async getDoctorContacts(user: Users) {
    const doctor: Doctors = await this.getDoctor(user);
    await Promise.all(
      doctor.patients.map(async (patient: any) => {
        const patientDoc: Patients = await this.patientsModel.findOne({
          code: patient.code,
        });
        patient.familyMembers = patientDoc.familyMembers;
      }),
    );
    return {
      data: new ResponseDoctorContactsDto(doctor),
    };
  }

  public async addPatient(user: Users, data: AddPatientDto) {
    let doctor: DoctorDocument = await this.getDoctor(user);
    if (!doctor) throw new BadRequestException('Doctor not found');
    const patient: PatientDocument = await this.patientsModel.findOne({
      code: data.patient,
    });
    if (!patient || patient.doctor)
      throw new BadRequestException('this patient already have a doctor');
    await patient.updateOne({ doctor: doctor.doctor });
    doctor = await this.doctorsModel.findOneAndUpdate(
      { code: user.code },
      { $addToSet: { patients: patient.patient } },
      { new: true },
    );
    return {
      message: 'patient added successfully',
      data: new ResponseDoctorContactsDto(JSON.parse(JSON.stringify(doctor))),
    };
  }

  public async deletePatient(user: Users, code: string) {
    let doctor: DoctorDocument = await this.getDoctor(user);
    const patient: PatientDocument = await this.patientsModel.findOne({
      code: code,
    });
    if (!patient) throw new BadRequestException('Patient not found');
    if (patient.doctor && patient.doctor.code !== user.code)
      throw new BadRequestException('this patient is not yours');
    doctor = await this.doctorsModel.findOneAndUpdate(
      { code: user.code },
      { $pull: { patients: patient.patient } },
      { new: true },
    );
    await patient.updateOne({ $unset: { doctor: '' } });
    return {
      message: 'patient deleted successfully',
      data: new ResponseDoctorContactsDto(JSON.parse(JSON.stringify(doctor))),
    };
  }

  private async getDoctor(user: Users) {
    const doctor: Doctors = await this.doctorsModel.findOne({
      code: user.code,
    });
    return JSON.parse(JSON.stringify(doctor));
  }
}
