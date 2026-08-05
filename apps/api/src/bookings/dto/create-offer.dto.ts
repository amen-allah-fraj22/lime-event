import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateOfferDto {
  @IsInt()
  @Min(0)
  fee!: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  includes_transport?: boolean;

  @IsOptional()
  @IsBoolean()
  includes_meals?: boolean;

  @IsOptional()
  @IsBoolean()
  includes_accommodation?: boolean;

  @IsOptional()
  @IsString()
  other_conditions?: string;
}
