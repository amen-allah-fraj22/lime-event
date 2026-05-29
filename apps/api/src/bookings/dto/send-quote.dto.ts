import { IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class SendQuoteDto {
  @IsInt()
  @Min(1)
  quote_amount!: number;

  @IsOptional()
  @IsObject()
  quote_conditions?: Record<string, unknown>;
}
