import { IsIn, IsString } from 'class-validator';
import { APP_ROLES } from '../../auth/app-roles';

export class SetActiveRoleDto {
  @IsString()
  @IsIn(APP_ROLES)
  active_role!: string;
}
