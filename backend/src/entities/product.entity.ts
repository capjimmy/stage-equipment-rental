import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Asset } from './asset.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('products')
@Index(['title']) // 제목 검색용 인덱스
@Index(['categoryId']) // 카테고리 필터링용 인덱스
@Index(['supplierId']) // 공급자별 조회용 인덱스
@Index(['status']) // 상태별 필터링용 인덱스
@Index(['createdAt']) // 최신순 정렬용 인덱스
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  supplierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supplierId' })
  supplier: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  images: string[]; // 메인 이미지들 (썸네일, 갤러리)

  @Column({ type: 'simple-array', nullable: true })
  detailImages: string[]; // 상세 설명 이미지들

  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  baseDailyPrice: number; // 기본 1일 렌탈가

  @Column({
    type: 'varchar',
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @ManyToMany(() => Tag, (tag) => tag.products)
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'productId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Asset, (asset) => asset.product)
  assets: Asset[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
