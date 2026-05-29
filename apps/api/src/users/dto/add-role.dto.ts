import { IsIn, IsString } from 'class-validator';
import { APP_ROLES } from '../../auth/app-roles';

export class AddRoleDto {
  @IsString()
  @IsIn(APP_ROLES)
  role!: string;
}
