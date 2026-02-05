import { User } from './user.entity';
import { Rental } from './rental.entity';
import { Payment } from './payment.entity';
export declare enum PaymentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    FAILED = "failed",
    EXPIRED = "expired",
    REFUNDED = "refunded"
}
export declare enum FulfillmentStatus {
    REQUESTED = "requested",
    HOLD_PENDINGPAY = "hold_pendingpay",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    DISPATCHED = "dispatched",
    DELIVERED = "delivered",
    RETURNED = "returned",
    INSPECTING = "inspecting",
    INSPECTION_PASSED = "inspection_passed",
    INSPECTION_FAILED = "inspection_failed",
    REJECTED = "rejected",
    CANCELED = "canceled",
    EXPIRED = "expired"
}
export declare enum DeliveryMethod {
    QUICK = "quick",
    PARCEL = "parcel",
    BUNDLE = "bundle"
}
export declare class Order {
    id: string;
    userId: string;
    user: User;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    deliveryMethod: DeliveryMethod;
    shippingCost: number;
    shippingAddress: string;
    returnAddress: string;
    deliveryNotes: string;
    depositDeadlineAt: Date;
    adminApprovedAt1: Date;
    adminApprovedAt2: Date;
    canceledAt: Date;
    canceledBy: string;
    cancellationReason: string;
    refundRate: number;
    refundAmount: number;
    cancellationFee: number;
    refundProcessedAt: Date;
    rejectionReason: string;
    rentals: Rental[];
    payments: Payment[];
    createdAt: Date;
    updatedAt: Date;
}
