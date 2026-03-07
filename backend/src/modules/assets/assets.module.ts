import { Module, forwardRef } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { AssetsController } from './assets.controller'
import { AssetsService } from './assets.service'
import { Asset, AssetSchema } from './schemas/asset.schema'
import { AssetSeo, AssetSeoSchema } from './schemas/asset-seo.schema'
import { RecommendationsModule } from '../recommendations/recommendations.module'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: AssetSeo.name, schema: AssetSeoSchema },
    ]),
    forwardRef(() => RecommendationsModule),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
