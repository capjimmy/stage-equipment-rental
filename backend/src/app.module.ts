import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { CartModule } from './cart/cart.module';
import { UploadModule } from './upload/upload.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettlementsModule } from './settlements/settlements.module';
import { RentalIssuesModule } from './rental-issues/rental-issues.module';
import { AdminModule } from './admin/admin.module';
import {
  User,
  Category,
  Tag,
  Product,
  ProductBlockedPeriod,
  Asset,
  Cart,
  CartItem,
  Order,
  Rental,
  Payment,
  Settlement,
  RentalIssue,
  Notification,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'stage_rental.db',
      entities: [
        User,
        Category,
        Tag,
        Product,
        ProductBlockedPeriod,
        Asset,
        Cart,
        CartItem,
        Order,
        Rental,
        Payment,
        Settlement,
        RentalIssue,
        Notification,
      ],
      synchronize: true,
      logging: false,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    ProductsModule,
    CategoriesModule,
    TagsModule,
    CartModule,
    UploadModule,
    OrdersModule,
    NotificationsModule,
    SettlementsModule,
    RentalIssuesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
