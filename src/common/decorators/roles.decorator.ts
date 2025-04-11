import { SetMetadata } from '@nestjs/common';

export enum Role {
  PATIENT = 'patient',
  FAMILY = 'family',
  DOCTOR = 'doctor',
}

export const ROLES_KEY = 'Roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
