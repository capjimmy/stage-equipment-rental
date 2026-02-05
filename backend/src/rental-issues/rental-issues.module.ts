import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RentalIssuesService } from './rental-issues.service';
import { RentalIssuesController } from './rental-issues.controller';
import { RentalIssue } from '../entities/rental-issue.entity';
import { Rental } from '../entities/rental.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RentalIssue, Rental])],
  controllers: [RentalIssuesController],
  providers: [RentalIssuesService],
  exports: [RentalIssuesService],
})
export class RentalIssuesModule {}
