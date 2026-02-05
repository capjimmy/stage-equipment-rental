import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rental } from './rental.entity';
import { User } from './user.entity';

export enum IssueType {
  DAMAGE = 'damage',
  DELAY = 'delay',
  LOSS = 'loss',
}

export enum IssueSeverity {
  MINOR = 'minor',
  MAJOR = 'major',
  TOTAL_LOSS = 'total_loss',
}

export enum IssueStatus {
  DETECTED = 'detected',
  NOTIFIED = 'notified',
  NEGOTIATING = 'negotiating',
  RESOLVED = 'resolved',
  BILLED = 'billed',
  PAID = 'paid',
}

@Entity('rental_issues')
export class RentalIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  rentalId: string;

  @ManyToOne(() => Rental, (rental) => rental.issues)
  @JoinColumn({ name: 'rentalId' })
  rental: Rental;

  @Column({
    type: 'varchar',
  })
  type: IssueType;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  severity: IssueSeverity;

  @Column({ type: 'boolean', default: false })
  impactNextBooking: boolean; // 뒷타임 영향 여부

  @Column({ type: 'text', nullable: true })
  impactNotes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  impactCost: number;

  @Column({ type: 'uuid', nullable: true })
  reportedBy: string; // admin user id

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reportedBy' })
  reporter: User;

  @Column({ type: 'datetime', nullable: true })
  reportedAt: Date;

  @Column({ type: 'simple-array', nullable: true })
  evidencePhotos: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  additionalCharge: number; // 추가 청구액

  @Column({
    type: 'varchar',
    default: IssueStatus.DETECTED,
  })
  status: IssueStatus;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
