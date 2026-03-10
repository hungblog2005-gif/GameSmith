import {
  IsMongoId,
  IsNumber,
  IsString,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  assetId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @IsOptional()
  comment?: string;
}
