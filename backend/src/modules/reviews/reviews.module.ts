import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'

import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { Review, ReviewSchema } from './schemas/review.schema'
import { Asset, AssetSchema } from '../assets/schemas/asset.schema'
import { Order, OrderSchema } from '../orders/schemas/order.schema'

@Module({
  imports: [
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
