import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Role, Roles } from '../common/decorators/roles.decorator';
import { CustomRequest } from '../common/interfaces/custom-request.interface';
import { AddDoctorDto } from './dtos/add-doctor.dto';
import { AddFamilyMemberDto } from './dtos/add-family-member.dto';

@Controller('api/v1/patients')
@Roles(Role.PATIENT)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles(Role.FAMILY, Role.DOCTOR)
  async getAll(@Query() query: any) {
    return await this.patientsService.getAll(query);
  }

  @Get('contacts')
  async getPatientContacts(@Req() request: CustomRequest) {
    return await this.patientsService.getPatientContacts(request.user);
  }

  @Post('doctor')
  @HttpCode(HttpStatus.OK)
  async addDoctor(@Req() request: CustomRequest, @Body() data: AddDoctorDto) {
    return await this.patientsService.addDoctor(request.user, data);
  }

  @Delete('doctor')
  async deleteDoctor(@Req() request: CustomRequest) {
    return await this.patientsService.deleteDoctor(request.user);
  }

  @Post('family-member')
  @HttpCode(HttpStatus.OK)
  async addFamilyMember(
    @Req() request: CustomRequest,
    @Body() data: AddFamilyMemberDto,
  ) {
    return await this.patientsService.addFamilyMember(request.user, data);
  }

  @Delete('family-member')
  async deleteFamilyMember(@Req() request: CustomRequest) {
    return await this.patientsService.deleteFamilyMember(request.user);
  }
}
