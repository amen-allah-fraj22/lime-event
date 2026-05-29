import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  title!: string;

  @IsEnum(EventType)
  event_type!: EventType;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  venue?: string;

  @IsDateString()
  event_date!: string;

  @IsOptional()
  @IsString()
  start_time?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  duration_hours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  guest_count?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  budget_max?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  style_tags?: string[];
}
