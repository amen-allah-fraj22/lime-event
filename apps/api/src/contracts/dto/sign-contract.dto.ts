import { IsString, MinLength } from 'class-validator';

export class SignContractDto {
  /** PNG data URL from the signature canvas */
  @IsString()
  @MinLength(32)
  signature!: string;
}
