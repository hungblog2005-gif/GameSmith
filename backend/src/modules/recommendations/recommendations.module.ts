import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { MongooseModule } from '@nestjs/mongoose'

import { RecommendationsController } from './recommendations.controller'
import { RecommendationsService } from './recommendations.service'
import { Asset, AssetSchema } from '../assets/schemas/asset.schema'
import { User, UserSchema } from '../users/schemas/users.schema'

@Module({
  imports: [
    HttpModule.register({
      timeout: 60_000,
      maxRedirects: 3,
    }),
    MongooseModule.forFeature([
      { name: Asset.name, schema: AssetSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
