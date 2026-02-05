import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
export declare class NotificationsService {
    private notificationRepository;
    constructor(notificationRepository: Repository<Notification>);
    create(userId: string, type: NotificationType, title: string, message: string, relatedEntityId?: string): Promise<Notification>;
    findByUser(userId: string, onlyUnread?: boolean): Promise<Notification[]>;
    markAsRead(notificationId: string, userId: string): Promise<Notification>;
    markAllAsRead(userId: string): Promise<void>;
    delete(notificationId: string, userId: string): Promise<void>;
    cleanupOldNotifications(): Promise<void>;
    notifyOrderConfirmed(userId: string, orderId: string): Promise<void>;
    notifyOrderRejected(userId: string, orderId: string, reason?: string): Promise<void>;
    notifyOrderExpired(userId: string, orderId: string): Promise<void>;
    notifyOrderShipped(userId: string, orderId: string): Promise<void>;
    notifyOrderDelivered(userId: string, orderId: string): Promise<void>;
    notifyReturnReminder(userId: string, orderId: string, daysLeft: number): Promise<void>;
    notifyReturnCompleted(userId: string, orderId: string): Promise<void>;
    notifySettlementReady(userId: string, settlementId: string, amount: number): Promise<void>;
    notifyIssueDetected(userId: string, issueId: string, issueType: string): Promise<void>;
    notifyNewOrder(userId: string, orderId: string, productTitle: string): Promise<void>;
    notifyTagApprovalRequest(adminUserId: string, tagId: string, tagName: string): Promise<void>;
}
