import { IsString, MaxLength } from 'class-validator';

export class TrackPageviewDto {
  @IsString()
  @MaxLength(300)
  path!: string;

  @IsString()
  @MaxLength(100)
  session_id!: string;
}
