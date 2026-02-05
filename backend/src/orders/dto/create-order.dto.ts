import { IsNotEmpty, IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { DeliveryMethod } from '../../entities/order.entity';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(DeliveryMethod)
  deliveryMethod?: DeliveryMethod;

  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
