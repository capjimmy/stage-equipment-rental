import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any, onlyUnread?: string): Promise<import("../entities").Notification[]>;
    markAsRead(req: any, id: string): Promise<import("../entities").Notification>;
    markAllAsRead(req: any): Promise<{
        message: string;
    }>;
    deleteNotification(req: any, id: string): Promise<{
        message: string;
    }>;
}
