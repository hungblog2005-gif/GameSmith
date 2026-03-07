import { IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateSeoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsArray()
  file_format?: string[];

  @IsOptional()
  @IsString()
  license_type?: string;
}
