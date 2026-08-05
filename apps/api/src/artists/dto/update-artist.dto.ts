import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateArtistDto {
  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  profile_photo_url?: string;

  @IsOptional()
  @IsString()
  cover_photo_url?: string;

  @IsOptional()
  @IsIn(['solo', 'band'])
  artist_type?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instruments?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  years_experience?: number;

  @IsOptional()
  @IsString()
  performance_style?: string;

  @IsOptional()
  @IsString()
  band_name?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(50)
  band_size?: number;

  @IsOptional()
  band_members?: { name: string; role: string; instrument: string }[];

  @IsOptional()
  @IsBoolean()
  has_sound_system?: boolean;

  @IsOptional()
  @IsBoolean()
  has_lighting?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_sound_system?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_mixing_desk?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_lighting?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_microphones?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_instruments?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_stage_backdrop?: boolean;

  @IsOptional()
  @IsBoolean()
  provides_own_transport?: boolean;

  @IsOptional()
  @IsString()
  equipment_notes?: string;

  @IsOptional()
  @IsBoolean()
  needs_transport?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_accommodation?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_meals?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_drinks?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_stage_crew?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_parking?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_dressing_room?: boolean;

  @IsOptional()
  @IsBoolean()
  needs_sound_engineer?: boolean;

  @IsOptional()
  @IsString()
  requirements_notes?: string;

  @IsOptional()
  min_event_duration_hrs?: number;

  @IsOptional()
  max_event_duration_hrs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_events_per_month?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  setup_time_minutes?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subgenres?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  performance_types?: string[];

  @IsOptional()
  @IsInt()
  @Min(15)
  setlist_duration_min?: number;

  @IsOptional()
  @IsInt()
  @Min(15)
  setlist_duration_max?: number;

  @IsOptional()
  @IsString()
  pricing_notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  travel_options?: string[];

  @IsOptional()
  @IsString()
  travel_other?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  technical_rider?: string[];

  @IsOptional()
  @IsString()
  technical_other?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hospitality_rider?: string[];

  @IsOptional()
  @IsString()
  hospitality_other?: string;

  @IsOptional()
  @IsBoolean()
  travel_surcharge?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  travel_radius_km?: number;

  @IsOptional()
  portfolio_links?: { type: string; url: string; label?: string }[];

  @IsOptional()
  @IsString()
  demo_track_url?: string;
}
