import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UserCollectionsService } from './user-collections.service';
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';

@Controller('user-collections')
export class UserCollectionsController {
  constructor(
    private readonly userCollectionsService: UserCollectionsService,
  ) {}

  @Post()
  add(@Body() dto: CreateUserCollectionDto) {
    return this.userCollectionsService.add(dto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userCollectionsService.findByUser(userId);
  }
}
