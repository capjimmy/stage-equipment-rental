import { Order } from './order.entity';
export declare enum PaymentMethodType {
    BANK_TRANSFER = "bank_transfer",
    PG = "pg"
}
export declare enum PaymentTransactionStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    FAILED = "failed",
    EXPIRED = "expired"
}
export declare class Payment {
    id: string;
    orderId: string;
    order: Order;
    method: PaymentMethodType;
    status: PaymentTransactionStatus;
    amount: number;
    depositorName: string;
    depositDeadlineAt: Date;
    confirmedAt: Date;
    adminConfirmedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
