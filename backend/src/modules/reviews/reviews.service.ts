import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  create(dto: CreateReviewDto) {
    return this.reviewModel.create({
      asset: new Types.ObjectId(dto.assetId),
      user: new Types.ObjectId(dto.userId),
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  findByAsset(assetId: string) {
    return this.reviewModel
      .find({ asset: assetId })
      .populate('user')
      .exec();
  }
}
