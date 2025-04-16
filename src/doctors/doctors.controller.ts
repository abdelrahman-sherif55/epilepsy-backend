import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Role, Roles } from '../common/decorators/roles.decorator';
import { DoctorsService } from './doctors.service';
import { CustomRequest } from '../common/interfaces/custom-request.interface';
import { AddPatientDto } from '../family-members/dtos/add-patient.dto';

@Controller('api/v1/doctors')
@Roles(Role.DOCTOR)
export class DoctorsController {
  constructor(private readonly doctorService: DoctorsService) {}

  @Get()
  @Roles(Role.PATIENT, Role.FAMILY)
  async getAll(@Query() query: any) {
    return await this.doctorService.getAll(query);
  }

  @Get('contacts')
  async getDoctorContacts(@Req() request: CustomRequest) {
    return await this.doctorService.getDoctorContacts(request.user);
  }

  @Post('patients')
  @HttpCode(HttpStatus.OK)
  async addPatient(@Req() request: CustomRequest, @Body() data: AddPatientDto) {
    return await this.doctorService.addPatient(request.user, data);
  }

  @Delete('patients/:code')
  async deletePatient(
    @Req() request: CustomRequest,
    @Param('code') code: string,
  ) {
    return await this.doctorService.deletePatient(request.user, code);
  }
}
