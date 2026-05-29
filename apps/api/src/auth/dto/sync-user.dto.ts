import { ArrayMinSize, IsArray, IsEmail, IsIn, IsString } from 'class-validator';
import { APP_ROLES } from '../app-roles';

export class SyncUserDto {
  @IsEmail()
  email!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsIn(APP_ROLES, { each: true })
  roles!: string[];

  @IsString()
  clerk_user_id!: string;
}
