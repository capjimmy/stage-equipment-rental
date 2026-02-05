import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../entities/product.entity';
import { ProductBlockedPeriod } from '../entities/product-blocked-period.entity';
import { Asset } from '../entities/asset.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { Rental } from '../entities/rental.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductBlockedPeriod, Asset, Category, Tag, Rental]),
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
