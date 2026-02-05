import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_REJECTED = 'order_rejected',
  ORDER_EXPIRED = 'order_expired',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  RETURN_REMINDER = 'return_reminder',
  RETURN_COMPLETED = 'return_completed',
  SETTLEMENT_READY = 'settlement_ready',
  ISSUE_DETECTED = 'issue_detected',
  NEW_ORDER = 'new_order', // 공급자용
  TAG_APPROVAL_REQUEST = 'tag_approval_request', // 관리자용
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'varchar',
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  linkUrl: string;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'datetime', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
