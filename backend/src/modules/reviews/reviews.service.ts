import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Review, ReviewDocument } from './schemas/review.schema';
import { Asset, AssetDocument } from '../assets/schemas/asset.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Asset.name)
    private readonly assetModel: Model<AssetDocument>,
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Kiểm tra user đã mua sản phẩm
   */
  async verifyUserPurchase(userId: string, assetId: string): Promise<boolean> {
    const order = await this.orderModel.findOne({
      userId: new Types.ObjectId(userId),
      'items.assetId': new Types.ObjectId(assetId),
      status: { $in: ['completed', 'refunded'] },
    });
    return !!order;
  }

  /**
   * Kiểm tra user đã review sản phẩm này
   */
  async checkExistingReview(userId: string, assetId: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      assetId: new Types.ObjectId(assetId),
    });
  }

  /**
   * Tạo review mới
   */
  async create(dto: CreateReviewDto, userId: string): Promise<ReviewDocument> {
    const assetId = dto.assetId;

    // 1. Kiểm tra user đã mua sản phẩm
    const hasPurchased = await this.verifyUserPurchase(userId, assetId);
    if (!hasPurchased) {
      throw new ForbiddenException('Bạn chỉ có thể đánh giá sản phẩm đã mua');
    }

    // 2. Kiểm tra user chưa review sản phẩm này
    const existingReview = await this.checkExistingReview(userId, assetId);
    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này rồi');
    }

    // 3. Kiểm tra asset tồn tại
    const asset = await this.assetModel.findById(assetId);
    if (!asset) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    // 4. Lấy order để verification
    const order = await this.orderModel.findOne({
      userId: new Types.ObjectId(userId),
      'items.assetId': new Types.ObjectId(assetId),
      status: { $in: ['completed', 'refunded'] },
    });

    // 5. Tạo review
    const review = new this.reviewModel({
      assetId: new Types.ObjectId(assetId),
      userId: new Types.ObjectId(userId),
      rating: dto.rating,
      comment: dto.comment || '',
      verificationOrder: order?._id,
      isVerifiedPurchase: !!order,
    });

    const savedReview = await review.save();

    // 6. Cập nhật rating của asset
    await this.updateAssetRating(assetId);

    return savedReview.populate('user');
  }

  /**
   * Cập nhật rating của asset (average và count)
   */
  async updateAssetRating(assetId: string): Promise<void> {
    const reviews = await this.reviewModel.find({ assetId: assetId, isVerifiedPurchase: true });

    if (reviews.length === 0) {
      await this.assetModel.findByIdAndUpdate(assetId, {
        'ratings.average': 0,
        'ratings.count': 0,
      });
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = parseFloat((totalRating / reviews.length).toFixed(1));

    await this.assetModel.findByIdAndUpdate(assetId, {
      'ratings.average': averageRating,
      'ratings.count': reviews.length,
    });
  }

  /**
   * Lấy tất cả review của sản phẩm
   */
  findByAsset(assetId: string) {
    return this.reviewModel
      .find({ assetId: assetId, isVerifiedPurchase: true })
      .populate('userId', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy rating breakdown (5 sao, 4 sao, v.v.)
   */
  async getRatingBreakdown(assetId: string) {
    const reviews = await this.reviewModel.find({ assetId: assetId, isVerifiedPurchase: true });

    const breakdown = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    };

    reviews.forEach((review) => {
      if (breakdown[review.rating] !== undefined) {
        breakdown[review.rating].count += 1;
      }
    });

    const total = reviews.length;
    if (total > 0) {
      Object.keys(breakdown).forEach((stars) => {
        breakdown[stars].percentage = Math.round((breakdown[stars].count / total) * 100);
      });
    }

    return breakdown;
  }

  /**
   * Lấy review stats đầy đủ
   */
  async getAssetReviewStats(assetId: string) {
    const reviews = await this.findByAsset(assetId);
    const breakdown = await this.getRatingBreakdown(assetId);
    const asset = await this.assetModel.findById(assetId, 'ratings');

    return {
      average_rating: asset?.ratings?.average || 0,
      total_reviews: reviews.length,
      breakdown,
      reviews,
    };
  }

  /**
   * Xóa review (chỉ chủ review hoặc admin)
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa review này');
    }

    await this.reviewModel.findByIdAndDelete(reviewId);
    await this.updateAssetRating(review.assetId.toString());
  }

  /**
   * Cập nhật review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    dto: { rating?: number; comment?: string }
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw new NotFoundException('Review không tồn tại');
    }

    if (review.userId.toString() !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật review này');
    }

    if (dto.rating !== undefined) {
      if (dto.rating < 1 || dto.rating > 5) {
        throw new BadRequestException('Rating phải từ 1 đến 5');
      }
      review.rating = dto.rating;
    }

    if (dto.comment !== undefined) {
      review.comment = dto.comment;
    }

    const updated = await review.save();
    await this.updateAssetRating(review.assetId.toString());

    return updated.populate('userId');
  }

  /**
   * Kiểm tra user có thể review sản phẩm này không
   */
  async canUserReview(userId: string, assetId: string) {
    const hasPurchased = await this.verifyUserPurchase(userId, assetId);
    const hasReviewed = !!(await this.checkExistingReview(userId, assetId));

    return {
      can_review: hasPurchased && !hasReviewed,
      has_purchased: hasPurchased,
      has_reviewed: hasReviewed,
    };
  }
}
