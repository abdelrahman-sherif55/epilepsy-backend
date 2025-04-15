import { Controller } from '@nestjs/common';
import { Role, Roles } from '../common/decorators/roles.decorator';

@Controller('api/v1/family-members')
@Roles(Role.FAMILY)
export class FamilyMembersController {}
