import { IsMongoId } from 'class-validator';

export class CreateWishlistDto {
  @IsMongoId()
  user_id!: string;

  @IsMongoId()
  asset_id!: string;
}
