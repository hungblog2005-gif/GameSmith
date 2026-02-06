import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreateAssetDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsNumber()
  price!: number;

  @IsMongoId()
  categoryId!: string;

  @IsMongoId()
  creatorId!: string;
}
