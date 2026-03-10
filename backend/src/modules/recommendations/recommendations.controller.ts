import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';

import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /**
   * GET /recommendations/asset/:assetId?limit=10
   * Returns AI-powered similar assets for the given asset.
   */
  @Get('asset/:assetId')
  getAssetRecommendations(
    @Param('assetId') assetId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationsService.getAssetRecommendations(assetId, limit);
  }

  /**
   * GET /recommendations/user/:userId?limit=10
   * Returns personalised recommendations based on the user's purchase history.
   */
  @Get('user/:userId')
  getUserRecommendations(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationsService.getUserRecommendations(userId, limit);
  }

  /**
   * POST /recommendations/image-search
   * Upload a base64 image → BLIP captions it → vector search in Qdrant.
   */
  @Post('image-search')
  imageSearch(
    @Body('image_base64') imageBase64: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationsService.imageSearch(imageBase64 ?? '', limit);
  }

  /**
   * GET /recommendations/search?q=<text>&limit=10
   * Semantic search: returns assets ranked by vector similarity to the query text.
   */
  @Get('search')
  searchByQuery(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.recommendationsService.searchByQuery(query ?? '', limit);
  }

  /**
   * POST /recommendations/admin/reindex
   * Re-indexes all published assets into Qdrant (admin use only).
   */
  @Post('admin/reindex')
  reindexAll() {
    return this.recommendationsService.reindexAll();
  }
}
