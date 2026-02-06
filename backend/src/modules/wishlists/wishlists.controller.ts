import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Post()
  add(@Body() body: any) {
    return this.wishlistsService.add(body);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.wishlistsService.findByUser(userId);
  }
}
