import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UploadProofDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
