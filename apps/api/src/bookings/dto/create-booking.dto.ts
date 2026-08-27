import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  event_id!: string;

  // Optional: an organizer inviting a specific artist sends their User id here.
  // An artist applying to a public event omits it, and the service resolves it
  // from the authenticated caller. (This is a User id, not an ArtistProfile id.)
  @IsOptional()
  @IsUUID()
  artist_id?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
