import { Order } from './order.entity';
import { Asset } from './asset.entity';
import { RentalIssue } from './rental-issue.entity';
export declare enum RentalStatus {
    REQUESTED = "requested",
    HOLD_PENDINGPAY = "hold_pendingpay",
    CONFIRMED = "confirmed",
    RENTED = "rented",
    RETURNED = "returned",
    INSPECTED = "inspected",
    COMPLETED = "completed",
    CANCELED = "canceled",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare class Rental {
    id: string;
    orderId: string;
    order: Order;
    assetId: string;
    asset: Asset;
    startDate: Date;
    endDate: Date;
    bufferDays: number;
    blockedStart: Date;
    blockedEnd: Date;
    status: RentalStatus;
    quantity: number;
    rentalRate: number;
    cancelReason: string;
    issues: RentalIssue[];
    createdAt: Date;
    updatedAt: Date;
}
