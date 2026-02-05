import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Rental } from './rental.entity';
import { Payment } from './payment.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export enum FulfillmentStatus {
  REQUESTED = 'requested',
  HOLD_PENDINGPAY = 'hold_pendingpay',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  DISPATCHED = 'dispatched',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
  INSPECTING = 'inspecting',
  INSPECTION_PASSED = 'inspection_passed',
  INSPECTION_FAILED = 'inspection_failed',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum DeliveryMethod {
  QUICK = 'quick',
  PARCEL = 'parcel',
  BUNDLE = 'bundle',
}

@Entity('orders')
@Index(['userId']) // 사용자별 주문 조회용 인덱스
@Index(['paymentStatus']) // 결제 상태별 필터링용 인덱스
@Index(['fulfillmentStatus']) // 배송 상태별 필터링용 인덱스
@Index(['createdAt']) // 주문 날짜순 정렬용 인덱스
@Index(['startDate', 'endDate']) // 렌탈 기간 검색용 복합 인덱스
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number; // 렌탈료 + 배송비

  @Column({ default: 'bank_transfer' })
  paymentMethod: string;

  @Column({
    type: 'varchar',
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'varchar',
    default: FulfillmentStatus.REQUESTED,
  })
  fulfillmentStatus: FulfillmentStatus;

  // 배송 관련
  @Column({
    type: 'varchar',
    nullable: true,
  })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'text', nullable: true })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true })
  returnAddress: string;

  @Column({ type: 'text', nullable: true })
  deliveryNotes: string;

  // 입금 관련
  @Column({ type: 'datetime', nullable: true })
  depositDeadlineAt: Date;

  @Column({ type: 'datetime', nullable: true })
  adminApprovedAt1: Date; // 1차 승인 시각

  @Column({ type: 'datetime', nullable: true })
  adminApprovedAt2: Date; // 2차 승인(입금 확인) 시각

  // 취소/환불 관련
  @Column({ type: 'datetime', nullable: true })
  canceledAt: Date;

  @Column({ type: 'uuid', nullable: true })
  canceledBy: string; // user id

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  refundRate: number; // 환불율 (%)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cancellationFee: number;

  @Column({ type: 'datetime', nullable: true })
  refundProcessedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string; // 운영자 거절 사유

  @OneToMany(() => Rental, (rental) => rental.order)
  rentals: Rental[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
