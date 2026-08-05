import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class BrowseArtistsDto {
  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['solo', 'band'])
  artist_type?: string;

  @IsOptional()
  @IsString()
  has_sound?: string;

  @IsOptional()
  @IsString()
  has_lighting?: string;

  @IsOptional()
  @IsString()
  has_mixing?: string;
}
