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
import { Role, Roles } from '../common/decorators/roles.decorator';
import { FamilyMembersService } from './family-members.service';
import { CustomRequest } from '../common/interfaces/custom-request.interface';
import { AddPatientDto } from './dtos/add-patient.dto';

@Controller('api/v1/family-members')
@Roles(Role.FAMILY)
export class FamilyMembersController {
  constructor(private readonly familyMembersService: FamilyMembersService) {}

  @Get()
  @Roles(Role.PATIENT)
  async getAll(@Query() query: any) {
    return await this.familyMembersService.getAll(query);
  }

  @Get('contacts')
  async getFamilyMemberContacts(@Req() request: CustomRequest) {
    return await this.familyMembersService.getFamilyMemberContacts(
      request.user,
    );
  }

  @Post('patient')
  @HttpCode(HttpStatus.OK)
  async addPatient(@Req() request: CustomRequest, @Body() data: AddPatientDto) {
    return await this.familyMembersService.addPatient(request.user, data);
  }

  @Delete('patient')
  async deletePatient(@Req() request: CustomRequest) {
    return await this.familyMembersService.deletePatient(request.user);
  }
}
