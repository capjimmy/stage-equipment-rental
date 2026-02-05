import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Product } from './product.entity';

export enum TagStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

export enum TagType {
  COUNTRY = 'country',
  ERA = 'era',
  MOOD = 'mood',
  PROP = 'prop',
  GENRE = 'genre',
  OTHER = 'other',
}

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({
    type: 'varchar',
    default: TagType.OTHER,
    nullable: true,
  })
  type: TagType;

  @Column({ type: 'simple-array', nullable: true })
  synonyms: string[]; // 동의어 리스트

  @Column({
    type: 'varchar',
    default: TagStatus.PENDING,
  })
  status: TagStatus;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string; // admin or supplier user id

  @ManyToMany(() => Product, (product) => product.tags)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
