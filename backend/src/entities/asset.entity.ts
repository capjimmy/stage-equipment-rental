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
import { Product } from './product.entity';
import { Rental } from './rental.entity';

export enum AssetConditionGrade {
  A = 'A',
  B = 'B',
  C = 'C',
}

export enum AssetStatus {
  AVAILABLE = 'available',
  RENTED = 'rented',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
  LOST = 'lost',
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.assets)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ unique: true })
  assetCode: string; // 예: A-001

  @Column({
    type: 'varchar',
    default: AssetConditionGrade.A,
  })
  conditionGrade: AssetConditionGrade;

  @Column({
    type: 'varchar',
    default: AssetStatus.AVAILABLE,
  })
  status: AssetStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @OneToMany(() => Rental, (rental) => rental.asset)
  rentals: Rental[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
