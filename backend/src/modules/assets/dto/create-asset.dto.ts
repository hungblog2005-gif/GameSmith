import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsNumber()
  price!: number;

  @IsOptional()
  @IsNumber()
  discount_percentage?: number;

  @IsOptional()
  @IsBoolean()
  is_free?: boolean;

  @IsMongoId()
  categoryId!: string;

  @IsMongoId()
  creatorId!: string;

  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preview_images?: string[];

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  file_format?: string[];

  @IsOptional()
  @IsString()
  file_size?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  game_engine_support?: string[];

  @IsOptional()
  @IsIn(['personal', 'commercial', 'enterprise', 'extended', 'free'])
  license_type?: string;

  @IsOptional()
  @IsNumber()
  polygon_count?: number;

  @IsOptional()
  @IsString()
  texture_resolution?: string;

  @IsOptional()
  @IsBoolean()
  animated?: boolean;

  @IsOptional()
  @IsBoolean()
  rigged?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
