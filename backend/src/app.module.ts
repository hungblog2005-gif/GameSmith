import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';

import { DatabaseModule } from './database/database.module';

import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { AssetsModule } from './modules/assets/assets.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
import { UserCollectionsModule } from './modules/user-collections/user-collections.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CartsModule } from './modules/carts/carts.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { StorageModule } from './modules/storage/storage.module';
import { DownloadsModule } from './modules/downloads/downloads.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Global rate limiter: 60 requests/min default; download endpoint overrides to 5/min
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    DatabaseModule,
    UsersModule,
    CategoriesModule,
    AssetsModule,
    ReviewsModule,
    OrdersModule,
    PaymentsModule,
    TransactionsModule,
    WishlistsModule,
    UserCollectionsModule,
    ProfilesModule,
    MessagesModule,
    CartsModule,
    RecommendationsModule,
    StorageModule,
    DownloadsModule,
  ],
})
export class AppModule {}
