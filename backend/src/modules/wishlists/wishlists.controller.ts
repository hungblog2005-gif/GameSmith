import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  /** GET /wishlists/user/:userId - get all wishlist items */
  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.wishlistsService.findByUser(userId);
  }

  /** POST /wishlists/user/:userId/asset/:assetId - toggle asset in wishlist */
  @Post('user/:userId/asset/:assetId')
  toggle(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.wishlistsService.toggle(userId, assetId);
  }

  /** DELETE /wishlists/user/:userId/asset/:assetId - remove asset from wishlist */
  @Delete('user/:userId/asset/:assetId')
  removeAsset(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.wishlistsService.removeAsset(userId, assetId);
  }

  /** GET /wishlists/user/:userId/check/:assetId - check if asset is in wishlist */
  @Get('user/:userId/check/:assetId')
  check(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.wishlistsService.isInWishlist(userId, assetId);
  }
}
