import { BadRequestException, Injectable } from '@nestjs/common';
import { Crud } from '../common/classes/crud';
import { PatientDocument, Patients } from '../patients/patients.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyMemberDocument, FamilyMembers } from './family-members.schema';
import { UserDocument, Users } from '../users/users.schema';
import { ResponseFamilyMemberDto } from './dtos/response-family-member.dto';
import { ResponseFamilyMemberContactsDto } from './dtos/response-family-member-contacts.dto';
import { AddPatientDto } from './dtos/add-patient.dto';

@Injectable()
export class FamilyMembersService {
  private crud: Crud<FamilyMembers>;

  constructor(
    @InjectModel(Patients.name) private readonly patientsModel: Model<Patients>,
    @InjectModel(FamilyMembers.name)
    private readonly familyMembersModel: Model<FamilyMembers>,
  ) {
    this.crud = new Crud<FamilyMembers>(
      this.familyMembersModel,
      'family members',
    );
  }

  public async getAll(query: any) {
    const familyMembers = await this.crud.getAll(query);
    return {
      ...familyMembers,
      data: familyMembers.data.map(
        (familyMember: FamilyMembers) =>
          new ResponseFamilyMemberDto(familyMember),
      ),
    };
  }

  public async getFamilyMemberContacts(user: Users) {
    const familyMember: any = await this.getFamilyMember(user);
    if (familyMember?.patient) {
      const patientDoc: Patients = await this.patientsModel.findOne({
        code: familyMember.patient.code,
      });
      familyMember.patient.predictionHistory = patientDoc.predictionHistory;
    }
    return {
      data: new ResponseFamilyMemberContactsDto(familyMember),
    };
  }

  public async addPatient(user: Users, data: AddPatientDto) {
    let familyMember: FamilyMembers = await this.getFamilyMember(user);
    if (familyMember.patient)
      throw new BadRequestException('you already have a patient');
    const patient: PatientDocument = await this.patientsModel.findOne({
      code: data.patient,
    });
    if (!patient) throw new BadRequestException('Patient not found');
    familyMember = await this.familyMembersModel.findOneAndUpdate(
      { code: user.code },
      { patient: patient.patient },
      { new: true },
    );
    await patient.updateOne({
      $addToSet: { familyMembers: familyMember.familyMember },
    });
    return {
      message: 'patient added successfully',
      data: new ResponseFamilyMemberContactsDto(
        JSON.parse(JSON.stringify(familyMember)),
      ),
    };
  }

  public async deletePatient(user: Users) {
    let familyMember: FamilyMemberDocument = await this.getFamilyMember(user);
    if (!familyMember.patient)
      throw new BadRequestException("you don't have patient to delete");
    const patient: UserDocument = familyMember.patient as any;
    const familyMemberUser: UserDocument = familyMember.familyMember as any;
    await this.patientsModel.updateOne(
      { patient: patient._id },
      { $pull: { familyMembers: familyMemberUser._id } },
    );
    familyMember = await this.familyMembersModel.findOneAndUpdate(
      { code: user.code },
      { $unset: { patient: '' } },
      { new: true },
    );
    return {
      message: 'your patient deleted successfully',
      data: new ResponseFamilyMemberContactsDto(
        JSON.parse(JSON.stringify(familyMember)),
      ),
    };
  }

  private async getFamilyMember(user: Users) {
    const familyMember: FamilyMembers = await this.familyMembersModel.findOne({
      code: user.code,
    });
    return JSON.parse(JSON.stringify(familyMember));
  }
}
