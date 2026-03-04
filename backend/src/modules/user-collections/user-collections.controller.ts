import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { UserCollectionsService } from './user-collections.service';
import { CreateUserCollectionDto } from './dto/create-user-collection.dto';

@Controller('user-collections')
export class UserCollectionsController {
  constructor(
    private readonly userCollectionsService: UserCollectionsService,
  ) {}

  @Post(':userId')
  create(
    @Param('userId') userId: string,
    @Body() dto: { name: string; description?: string; isPublic?: boolean },
  ) {
    return this.userCollectionsService.create(userId, dto);
  }

  @Post(':collectionId/assets')
  addAsset(
    @Param('collectionId') collectionId: string,
    @Body('assetId') assetId: string,
  ) {
    return this.userCollectionsService.addAsset(collectionId, assetId);
  }

  @Delete(':collectionId/assets/:assetId')
  removeAsset(
    @Param('collectionId') collectionId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.userCollectionsService.removeAsset(collectionId, assetId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.userCollectionsService.findByUser(userId);
  }

  @Get('public')
  findPublic() {
    return this.userCollectionsService.findPublic();
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userCollectionsService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; isPublic?: boolean; thumbnailUrl?: string },
  ) {
    return this.userCollectionsService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userCollectionsService.delete(id);
  }
}
