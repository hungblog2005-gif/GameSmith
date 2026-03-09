import { Module, forwardRef } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

import { AssetsController } from './assets.controller'
import { AssetsService } from './assets.service'
import { FeaturedScoreService } from './featured-score.service'
import { FeaturedScoreScheduler } from './featured-score.scheduler'
import { Asset, AssetSchema } from './schemas/asset.schema'
import { AssetSeo, AssetSeoSchema } from './schemas/asset-seo.schema'
import { DownloadLog, DownloadLogSchema } from '../downloads/schemas/download.schema'
import { RecommendationsModule } from '../recommendations/recommendations.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: AssetSeo.name, schema: AssetSeoSchema },
      { name: DownloadLog.name, schema: DownloadLogSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'defaultSecret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
    forwardRef(() => RecommendationsModule),
  ],
  controllers: [AssetsController],
  providers: [AssetsService, FeaturedScoreService, FeaturedScoreScheduler],
  exports: [AssetsService, FeaturedScoreService],
})
export class AssetsModule {}
