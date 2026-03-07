import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Tạo review mới (yêu cầu JWT auth)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateReviewDto, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.reviewsService.create(dto, userId);
  }

  /**
   * Lấy tất cả review của sản phẩm
   */
  @Get('asset/:assetId')
  async findByAsset(@Param('assetId') assetId: string) {
    return this.reviewsService.findByAsset(assetId);
  }

  /**
   * Lấy rating breakdown của sản phẩm
   */
  @Get('asset/:assetId/breakdown')
  async getRatingBreakdown(@Param('assetId') assetId: string) {
    return this.reviewsService.getRatingBreakdown(assetId);
  }

  /**
   * Lấy đầy đủ review stats (average, count, breakdown, reviews)
   */
  @Get('asset/:assetId/stats')
  async getAssetReviewStats(@Param('assetId') assetId: string) {
    return this.reviewsService.getAssetReviewStats(assetId);
  }

  /**
   * Kiểm tra user có thể review sản phẩm này không
   */
  @Get('asset/:assetId/can-review')
  @UseGuards(JwtAuthGuard)
  async canUserReview(@Param('assetId') assetId: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    return this.reviewsService.canUserReview(userId, assetId);
  }

  /**
   * Xóa review
   */
  @Delete(':reviewId')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('reviewId') reviewId: string, @Request() req: any) {
    const userId = req.user.sub || req.user.id;
    await this.reviewsService.deleteReview(reviewId, userId);
    return { message: 'Review deleted successfully' };
  }

  /**
   * Cập nhật review
   */
  @Patch(':reviewId')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('reviewId') reviewId: string,
    @Body() dto: { rating?: number; comment?: string },
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    // Validate input
    if (dto.rating !== undefined && (typeof dto.rating !== 'number' || dto.rating < 1 || dto.rating > 5)) {
      throw new BadRequestException('Rating phải là số từ 1 đến 5');
    }

    return this.reviewsService.updateReview(reviewId, userId, dto);
  }
}
