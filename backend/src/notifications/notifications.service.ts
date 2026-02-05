import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * 알림 생성
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityId?: string,
  ): Promise<Notification> {
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

  /**
   * 사용자의 알림 목록 조회
   */
  async findByUser(userId: string, onlyUnread = false): Promise<Notification[]> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (onlyUnread) {
      query.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    return query.getMany();
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
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

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();
  }

  /**
   * 알림 삭제
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      userId,
    });

    if (result.affected === 0) {
      throw new Error('Notification not found');
    }
  }

  /**
   * 읽은 지 30일 이상 된 알림 자동 삭제
   */
  async cleanupOldNotifications(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('isRead = :isRead', { isRead: true })
      .andWhere('readAt < :date', { date: thirtyDaysAgo })
      .execute();
  }

  /**
   * 주문 확정 알림
   */
  async notifyOrderConfirmed(userId: string, orderId: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ORDER_CONFIRMED,
      '주문이 확정되었습니다',
      '주문이 성공적으로 확정되었습니다. 입금 확인 후 배송이 시작됩니다.',
      orderId,
    );
  }

  /**
   * 주문 거절 알림
   */
  async notifyOrderRejected(userId: string, orderId: string, reason?: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ORDER_REJECTED,
      '주문이 거절되었습니다',
      reason || '주문이 거절되었습니다. 자세한 사항은 고객센터로 문의해주세요.',
      orderId,
    );
  }

  /**
   * 주문 기간 만료 알림
   */
  async notifyOrderExpired(userId: string, orderId: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ORDER_EXPIRED,
      '주문이 만료되었습니다',
      '입금 기한이 지나 주문이 자동 취소되었습니다.',
      orderId,
    );
  }

  /**
   * 배송 시작 알림
   */
  async notifyOrderShipped(userId: string, orderId: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ORDER_SHIPPED,
      '배송이 시작되었습니다',
      '주문하신 상품의 배송이 시작되었습니다.',
      orderId,
    );
  }

  /**
   * 배송 완료 알림
   */
  async notifyOrderDelivered(userId: string, orderId: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ORDER_DELIVERED,
      '배송이 완료되었습니다',
      '상품이 배송되었습니다. 수령 후 확인 부탁드립니다.',
      orderId,
    );
  }

  /**
   * 반납 기한 알림
   */
  async notifyReturnReminder(userId: string, orderId: string, daysLeft: number): Promise<void> {
    await this.create(
      userId,
      NotificationType.RETURN_REMINDER,
      `반납 기한 ${daysLeft}일 전입니다`,
      `대여하신 상품의 반납 기한이 ${daysLeft}일 남았습니다. 기한 내 반납 부탁드립니다.`,
      orderId,
    );
  }

  /**
   * 반납 완료 알림
   */
  async notifyReturnCompleted(userId: string, orderId: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.RETURN_COMPLETED,
      '반납이 완료되었습니다',
      '상품 반납이 확인되었습니다. 이용해 주셔서 감사합니다.',
      orderId,
    );
  }

  /**
   * 정산 준비 완료 알림 (공급자용)
   */
  async notifySettlementReady(userId: string, settlementId: string, amount: number): Promise<void> {
    await this.create(
      userId,
      NotificationType.SETTLEMENT_READY,
      '정산이 준비되었습니다',
      `${amount.toLocaleString()}원의 정산이 준비되었습니다.`,
      settlementId,
    );
  }

  /**
   * 렌탈 이슈 발생 알림
   */
  async notifyIssueDetected(userId: string, issueId: string, issueType: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.ISSUE_DETECTED,
      '렌탈 이슈가 발생했습니다',
      `${issueType} 이슈가 발생했습니다. 확인이 필요합니다.`,
      issueId,
    );
  }

  /**
   * 신규 주문 알림 (공급자용)
   */
  async notifyNewOrder(userId: string, orderId: string, productTitle: string): Promise<void> {
    await this.create(
      userId,
      NotificationType.NEW_ORDER,
      '새로운 주문이 접수되었습니다',
      `'${productTitle}' 상품에 새로운 주문이 접수되었습니다.`,
      orderId,
    );
  }

  /**
   * 태그 승인 요청 알림 (관리자용)
   */
  async notifyTagApprovalRequest(adminUserId: string, tagId: string, tagName: string): Promise<void> {
    await this.create(
      adminUserId,
      NotificationType.TAG_APPROVAL_REQUEST,
      '태그 승인 요청',
      `'${tagName}' 태그 승인 요청이 있습니다.`,
      tagId,
    );
  }
}
