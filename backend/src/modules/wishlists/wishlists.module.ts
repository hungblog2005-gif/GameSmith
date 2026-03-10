import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema';
import { Asset, AssetSchema } from '../assets/schemas/asset.schema';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [WishlistsController],
  providers: [WishlistsService],
})
export class WishlistsModule {}
