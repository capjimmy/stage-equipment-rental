import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity('product_blocked_periods')
@Index(['productId']) // 상품별 조회용 인덱스
@Index(['blockedStart', 'blockedEnd']) // 기간 검색용 복합 인덱스
export class ProductBlockedPeriod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'date' })
  blockedStart: Date;

  @Column({ type: 'date' })
  blockedEnd: Date;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @CreateDateColumn()
  createdAt: Date;
}
