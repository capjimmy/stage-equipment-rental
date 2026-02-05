import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

export enum PaymentMethodType {
  BANK_TRANSFER = 'bank_transfer',
  PG = 'pg',
}

export enum PaymentTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({
    type: 'varchar',
    default: PaymentMethodType.BANK_TRANSFER,
  })
  method: PaymentMethodType;

  @Column({
    type: 'varchar',
    default: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // 계좌이체 전용 필드
  @Column({ nullable: true })
  depositorName: string;

  @Column({ type: 'datetime', nullable: true })
  depositDeadlineAt: Date;

  @Column({ type: 'datetime', nullable: true })
  confirmedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  adminConfirmedBy: string; // admin user id

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
