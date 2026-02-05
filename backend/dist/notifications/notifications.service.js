"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
let NotificationsService = class NotificationsService {
    notificationRepository;
    constructor(notificationRepository) {
        this.notificationRepository = notificationRepository;
    }
    async create(userId, type, title, message, relatedEntityId) {
        const notification = this.notificationRepository.create({
            userId,
            type,
            title,
            message,
            relatedEntityId,
            isRead: false,
        });
        return this.notificationRepository.save(notification);
    }
    async findByUser(userId, onlyUnread = false) {
        const query = this.notificationRepository
            .createQueryBuilder('notification')
            .where('notification.userId = :userId', { userId })
            .orderBy('notification.createdAt', 'DESC');
        if (onlyUnread) {
            query.andWhere('notification.isRead = :isRead', { isRead: false });
        }
        return query.getMany();
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId },
        });
        if (!notification) {
            throw new Error('Notification not found');
        }
        notification.isRead = true;
        notification.readAt = new Date();
        return this.notificationRepository.save(notification);
    }
    async markAllAsRead(userId) {
        await this.notificationRepository
            .createQueryBuilder()
            .update(notification_entity_1.Notification)
            .set({ isRead: true, readAt: new Date() })
            .where('userId = :userId', { userId })
            .andWhere('isRead = :isRead', { isRead: false })
            .execute();
    }
    async delete(notificationId, userId) {
        const result = await this.notificationRepository.delete({
            id: notificationId,
            userId,
        });
        if (result.affected === 0) {
            throw new Error('Notification not found');
        }
    }
    async cleanupOldNotifications() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        await this.notificationRepository
            .createQueryBuilder()
            .delete()
            .from(notification_entity_1.Notification)
            .where('isRead = :isRead', { isRead: true })
            .andWhere('readAt < :date', { date: thirtyDaysAgo })
            .execute();
    }
    async notifyOrderConfirmed(userId, orderId) {
        await this.create(userId, notification_entity_1.NotificationType.ORDER_CONFIRMED, '주문이 확정되었습니다', '주문이 성공적으로 확정되었습니다. 입금 확인 후 배송이 시작됩니다.', orderId);
    }
    async notifyOrderRejected(userId, orderId, reason) {
        await this.create(userId, notification_entity_1.NotificationType.ORDER_REJECTED, '주문이 거절되었습니다', reason || '주문이 거절되었습니다. 자세한 사항은 고객센터로 문의해주세요.', orderId);
    }
    async notifyOrderExpired(userId, orderId) {
        await this.create(userId, notification_entity_1.NotificationType.ORDER_EXPIRED, '주문이 만료되었습니다', '입금 기한이 지나 주문이 자동 취소되었습니다.', orderId);
    }
    async notifyOrderShipped(userId, orderId) {
        await this.create(userId, notification_entity_1.NotificationType.ORDER_SHIPPED, '배송이 시작되었습니다', '주문하신 상품의 배송이 시작되었습니다.', orderId);
    }
    async notifyOrderDelivered(userId, orderId) {
        await this.create(userId, notification_entity_1.NotificationType.ORDER_DELIVERED, '배송이 완료되었습니다', '상품이 배송되었습니다. 수령 후 확인 부탁드립니다.', orderId);
    }
    async notifyReturnReminder(userId, orderId, daysLeft) {
        await this.create(userId, notification_entity_1.NotificationType.RETURN_REMINDER, `반납 기한 ${daysLeft}일 전입니다`, `대여하신 상품의 반납 기한이 ${daysLeft}일 남았습니다. 기한 내 반납 부탁드립니다.`, orderId);
    }
    async notifyReturnCompleted(userId, orderId) {
        await this.create(userId, notification_entity_1.NotificationType.RETURN_COMPLETED, '반납이 완료되었습니다', '상품 반납이 확인되었습니다. 이용해 주셔서 감사합니다.', orderId);
    }
    async notifySettlementReady(userId, settlementId, amount) {
        await this.create(userId, notification_entity_1.NotificationType.SETTLEMENT_READY, '정산이 준비되었습니다', `${amount.toLocaleString()}원의 정산이 준비되었습니다.`, settlementId);
    }
    async notifyIssueDetected(userId, issueId, issueType) {
        await this.create(userId, notification_entity_1.NotificationType.ISSUE_DETECTED, '렌탈 이슈가 발생했습니다', `${issueType} 이슈가 발생했습니다. 확인이 필요합니다.`, issueId);
    }
    async notifyNewOrder(userId, orderId, productTitle) {
        await this.create(userId, notification_entity_1.NotificationType.NEW_ORDER, '새로운 주문이 접수되었습니다', `'${productTitle}' 상품에 새로운 주문이 접수되었습니다.`, orderId);
    }
    async notifyTagApprovalRequest(adminUserId, tagId, tagName) {
        await this.create(adminUserId, notification_entity_1.NotificationType.TAG_APPROVAL_REQUEST, '태그 승인 요청', `'${tagName}' 태그 승인 요청이 있습니다.`, tagId);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map