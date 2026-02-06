import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { UserCollectionsController } from './user-collections.controller'
import { UserCollectionsService } from './user-collections.service'
import {
  UserCollection,
  UserCollectionSchema,
} from './schemas/user-collection.schema'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserCollection.name, schema: UserCollectionSchema },
    ]),
  ],
  controllers: [UserCollectionsController],
  providers: [UserCollectionsService],
})
export class UserCollectionsModule {}
