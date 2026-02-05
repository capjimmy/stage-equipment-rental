import { DeliveryMethod } from '../../entities/order.entity';
export declare class CreateOrderDto {
    startDate: string;
    endDate: string;
    deliveryMethod?: DeliveryMethod;
    shippingAddress?: string;
    deliveryNotes?: string;
    paymentMethod?: string;
}
