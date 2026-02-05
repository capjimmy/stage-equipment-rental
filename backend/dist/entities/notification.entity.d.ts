import { User } from './user.entity';
export declare enum NotificationType {
    ORDER_CONFIRMED = "order_confirmed",
    ORDER_REJECTED = "order_rejected",
    ORDER_EXPIRED = "order_expired",
    ORDER_SHIPPED = "order_shipped",
    ORDER_DELIVERED = "order_delivered",
    RETURN_REMINDER = "return_reminder",
    RETURN_COMPLETED = "return_completed",
    SETTLEMENT_READY = "settlement_ready",
    ISSUE_DETECTED = "issue_detected",
    NEW_ORDER = "new_order",
    TAG_APPROVAL_REQUEST = "tag_approval_request"
}
export declare class Notification {
    id: string;
    userId: string;
    user: User;
    type: NotificationType;
    title: string;
    message: string;
    linkUrl: string;
    relatedEntityId: string;
    isRead: boolean;
    readAt: Date;
    createdAt: Date;
}
