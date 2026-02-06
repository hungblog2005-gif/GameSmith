import { IsMongoId, IsString } from 'class-validator';

export class CreateUserCollectionDto {
  @IsMongoId()
  userId!: string;

  @IsMongoId()
  assetId!: string;

  @IsString()
  collectionType!: string; // ví dụ: wishlist | owned | favorite
}
