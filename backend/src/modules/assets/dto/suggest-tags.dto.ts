import { IsArray, IsOptional, IsString } from 'class-validator';

export class SuggestTagsDto {
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category_name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_names?: string[];
}
