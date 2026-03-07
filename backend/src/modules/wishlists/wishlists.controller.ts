import { Controller, Get, Post, Delete, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';

@Controller('wishlists')
export class WishlistsController {
  private readonly logger = new Logger(WishlistsController.name);

  constructor(private readonly wishlistsService: WishlistsService) {}

  /** GET /wishlists/user/:userId - get all wishlist items */
  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    try {
      return await this.wishlistsService.findByUser(userId);
    } catch (error) {
      this.logger.error(`Error finding wishlist for user ${userId}:`, error);
      throw new HttpException(
        { message: 'Failed to fetch wishlist', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** POST /wishlists/user/:userId/asset/:assetId - toggle asset in wishlist */
  @Post('user/:userId/asset/:assetId')
  async toggle(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      return await this.wishlistsService.toggle(userId, assetId);
    } catch (error) {
      this.logger.error(`Error toggling wishlist for user ${userId}, asset ${assetId}:`, error);
      throw new HttpException(
        { message: 'Failed to toggle wishlist', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** DELETE /wishlists/user/:userId/asset/:assetId - remove asset from wishlist */
  @Delete('user/:userId/asset/:assetId')
  async removeAsset(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      return await this.wishlistsService.removeAsset(userId, assetId);
    } catch (error) {
      this.logger.error(`Error removing asset from wishlist for user ${userId}:`, error);
      throw new HttpException(
        { message: 'Failed to remove from wishlist', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /** GET /wishlists/user/:userId/check/:assetId - check if asset is in wishlist */
  @Get('user/:userId/check/:assetId')
  async check(
    @Param('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    try {
      return await this.wishlistsService.isInWishlist(userId, assetId);
    } catch (error) {
      this.logger.error(`Error checking wishlist for user ${userId}:`, error);
      throw new HttpException(
        { message: 'Failed to check wishlist', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
