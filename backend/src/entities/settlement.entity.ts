import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { Rental } from './rental.entity';

export enum SettlementType {
  RENTAL = 'rental', // 기본 렌탈료 (50:50)
  ISSUE = 'issue', // 파손/연체 추가 청구 (공급자 100%)
}

export enum SettlementStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PAID = 'paid',
}

@Entity('settlements')
export class Settlement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplierId' })
  supplier: User;

  @Column({ type: 'uuid', nullable: true })
  orderId: string;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'uuid', nullable: true })
  rentalId: string;

  @ManyToOne(() => Rental, { nullable: true })
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;

  @Column({
    type: 'varchar',
    default: SettlementType.RENTAL,
  })
  type: SettlementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  grossAmount: number; // 총액

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platformFeeAmount: number; // 플랫폼 수수료

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  supplierAmount: number; // 공급자 몫

  @Column({
    type: 'varchar',
    default: SettlementStatus.PENDING,
  })
  status: SettlementStatus;

  @Column({ type: 'date', nullable: true })
  settlementDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
