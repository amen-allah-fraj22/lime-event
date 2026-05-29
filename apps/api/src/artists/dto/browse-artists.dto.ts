import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class BrowseArtistsDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priceMax?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
