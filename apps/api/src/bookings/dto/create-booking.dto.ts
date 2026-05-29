import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  event_id!: string;

  @IsUUID()
  artist_id!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
