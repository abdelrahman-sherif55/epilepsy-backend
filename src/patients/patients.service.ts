import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PatientDocument, Patients } from './patients.schema';
import { Model } from 'mongoose';
import { Crud } from '../common/classes/crud';
import { ResponsePatientDto } from './dtos/response-patient.dto';
import { UserDocument, Users } from '../users/users.schema';
import { ResponsePatientContactsDto } from './dtos/response-patient-contacts.dto';
import { AddDoctorDto } from './dtos/add-doctor.dto';
import { AddFamilyMemberDto } from './dtos/add-family-member.dto';
import { DoctorDocument, Doctors } from '../doctors/doctors.schema';
import {
  FamilyMemberDocument,
  FamilyMembers,
} from '../family-members/family-members.schema';

@Injectable()
export class PatientsService {
  private crud: Crud<Patients>;

  constructor(
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(Doctors.name) private readonly doctorsModel: Model<Doctors>,
    @InjectModel(FamilyMembers.name)
    private readonly familyMembersModel: Model<FamilyMembers>,
  ) {
    this.crud = new Crud<Patients>(this.patientsModel, 'patients');
  }

  public async getAll(query: any) {
    const patients = await this.crud.getAll(query);
    return {
      ...patients,
      data: patients.data.map(
        (patient: Patients) => new ResponsePatientDto(patient),
      ),
    };
  }

  public async getPatientContacts(user: Users) {
    const patient: Patients = await this.getPatient(user);
    return {
      data: new ResponsePatientContactsDto(patient),
    };
  }

  public async addDoctor(user: Users, data: AddDoctorDto) {
    let patient: PatientDocument = await this.getPatient(user);
    if (patient.doctor)
      throw new BadRequestException('you already have a doctor');
    const doctor: DoctorDocument = await this.doctorsModel.findOne({
      code: data.doctor,
    });
    if (!doctor) throw new BadRequestException('Doctor not found');
    patient = await this.patientsModel.findOneAndUpdate(
      { code: user.code },
      { doctor: doctor.doctor },
      { new: true },
    );
    await doctor.updateOne({ $addToSet: { patients: patient.patient } });
    return {
      message: 'doctor added successfully',
      data: new ResponsePatientContactsDto(JSON.parse(JSON.stringify(patient))),
    };
  }

  public async deleteDoctor(user: Users) {
    let patient: PatientDocument = await this.getPatient(user);
    if (!patient.doctor)
      throw new BadRequestException("you don't have doctor to delete");
    const patientData: UserDocument = patient.patient as any;
    const doctor: UserDocument = patient.doctor as any;
    await this.doctorsModel.updateOne(
      { doctor: doctor._id },
      { $pull: { patients: patientData._id } },
    );
    patient = await this.patientsModel.findOneAndUpdate(
      { code: user.code },
      { $unset: { doctor: '' } },
      { new: true },
    );
    return {
      message: 'your doctor deleted successfully',
      data: new ResponsePatientContactsDto(JSON.parse(JSON.stringify(patient))),
    };
  }

  public async addFamilyMember(user: Users, data: AddFamilyMemberDto) {
    let patient: Patients = await this.getPatient(user);
    if (patient.familyMember)
      throw new BadRequestException('you already have a family member');
    const familyMember: FamilyMemberDocument =
      await this.familyMembersModel.findOne({
        code: data.familyMember,
      });
    if (!familyMember) throw new BadRequestException('Family Member not found');
    patient = await this.patientsModel.findOneAndUpdate(
      { code: user.code },
      { familyMember: familyMember.familyMember },
      { new: true },
    );
    await familyMember.updateOne({ patient: patient.patient });
    return {
      message: 'family member added successfully',
      data: new ResponsePatientContactsDto(JSON.parse(JSON.stringify(patient))),
    };
  }

  public async deleteFamilyMember(user: Users) {
    let patient: PatientDocument = await this.getPatient(user);
    if (!patient.familyMember)
      throw new BadRequestException("you don't have family member to delete");
    const familyMember: UserDocument = patient.familyMember as any;
    await this.familyMembersModel.updateOne(
      { familyMember: familyMember._id },
      { $unset: { patient: '' } },
    );
    patient = await this.patientsModel.findOneAndUpdate(
      { code: user.code },
      { $unset: { familyMember: '' } },
      { new: true },
    );
    return {
      message: 'your family member deleted successfully',
      data: new ResponsePatientContactsDto(JSON.parse(JSON.stringify(patient))),
    };
  }

  private async getPatient(user: Users) {
    const patient: Patients = await this.patientsModel.findOne({
      code: user.code,
    });
    return JSON.parse(JSON.stringify(patient));
  }
}
