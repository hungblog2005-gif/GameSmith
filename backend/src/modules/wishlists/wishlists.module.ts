import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { WishlistsController } from './wishlists.controller'
import { WishlistsService } from './wishlists.service'
import { Wishlist, WishlistSchema } from './schemas/wishlist.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wishlist.name, schema: WishlistSchema },
    ]),
  ],
  controllers: [WishlistsController],
  providers: [WishlistsService],
})
export class WishlistsModule {}
