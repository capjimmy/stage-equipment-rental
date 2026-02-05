import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { Settlement } from '../entities/settlement.entity';
import { Order } from '../entities/order.entity';
import { Rental } from '../entities/rental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, Order, Rental])],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
