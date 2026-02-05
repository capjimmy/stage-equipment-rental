import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Asset } from './asset.entity';
import { RentalIssue } from './rental-issue.entity';

export enum RentalStatus {
  REQUESTED = 'requested',
  HOLD_PENDINGPAY = 'hold_pendingpay',
  CONFIRMED = 'confirmed',
  RENTED = 'rented',
  RETURNED = 'returned',
  INSPECTED = 'inspected',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.rentals)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid' })
  assetId: string;

  @ManyToOne(() => Asset, (asset) => asset.rentals)
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'int', default: 1 })
  bufferDays: number; // 기본 1일

  @Column({ type: 'date' })
  blockedStart: Date; // = startDate

  @Column({ type: 'date' })
  blockedEnd: Date; // = endDate + bufferDays

  @Column({
    type: 'varchar',
    default: RentalStatus.REQUESTED,
  })
  status: RentalStatus;

  @Column({ type: 'int', default: 1 })
  quantity: number; // 대여 수량

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  rentalRate: number; // 일 대여료 (계약 시점 가격)

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @OneToMany(() => RentalIssue, (issue) => issue.rental)
  issues: RentalIssue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
