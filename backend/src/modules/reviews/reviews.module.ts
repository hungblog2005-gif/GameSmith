import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { ReviewsController } from './reviews.controller'
import { ReviewsService } from './reviews.service'
import { Review, ReviewSchema } from './schemas/review.schema'
import { Asset, AssetSchema } from '../assets/schemas/asset.schema'
import { Order, OrderSchema } from '../orders/schemas/order.schema'
import { DownloadLog, DownloadLogSchema } from '../downloads/schemas/download.schema'

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Order.name, schema: OrderSchema },
      { name: DownloadLog.name, schema: DownloadLogSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
