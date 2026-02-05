import { User } from './user.entity';
import { Order } from './order.entity';
import { Rental } from './rental.entity';
export declare enum SettlementType {
    RENTAL = "rental",
    ISSUE = "issue"
}
export declare enum SettlementStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PAID = "paid"
}
export declare class Settlement {
    id: string;
    supplierId: string;
    supplier: User;
    orderId: string;
    order: Order;
    rentalId: string;
    rental: Rental;
    type: SettlementType;
    grossAmount: number;
    platformFeeAmount: number;
    supplierAmount: number;
    status: SettlementStatus;
    settlementDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
