import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { DatabaseModule } from './database/database.module'

// Feature modules
import { UsersModule } from './modules/users/users.module'
import { CategoriesModule } from './modules/categories/categories.module'
import { AssetsModule } from './modules/assets/assets.module'
import { ReviewsModule } from './modules/reviews/reviews.module'
import { OrdersModule } from './modules/orders/orders.module'
import { TransactionsModule } from './modules/transactions/transactions.module'
import { WishlistsModule } from './modules/wishlists/wishlists.module'
import { UserCollectionsModule } from './modules/user-collections/user-collections.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,

    UsersModule,
    CategoriesModule,
    AssetsModule,
    ReviewsModule,
    OrdersModule,
    TransactionsModule,
    WishlistsModule,
    UserCollectionsModule,
  ],
})
export class AppModule {}
