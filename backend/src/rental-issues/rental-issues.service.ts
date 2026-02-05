import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RentalIssue,
  IssueType,
  IssueSeverity,
  IssueStatus,
} from '../entities/rental-issue.entity';
import { Rental } from '../entities/rental.entity';

@Injectable()
export class RentalIssuesService {
  constructor(
    @InjectRepository(RentalIssue)
    private rentalIssueRepository: Repository<RentalIssue>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
  ) {}

  /**
   * 이슈 생성
   */
  async create(
    rentalId: string,
    type: IssueType,
    severity: IssueSeverity,
    reportedBy: string,
    data: {
      impactNextBooking?: boolean;
      impactNotes?: string;
      impactCost?: number;
      evidencePhotos?: string[];
      additionalCharge?: number;
    },
  ): Promise<RentalIssue> {
    const rental = await this.rentalRepository.findOne({
      where: { id: rentalId },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const issue = this.rentalIssueRepository.create({
      rentalId,
      type,
      severity,
      reportedBy,
      reportedAt: new Date(),
      status: IssueStatus.DETECTED,
      ...data,
    });

    return this.rentalIssueRepository.save(issue);
  }

  /**
   * 이슈 목록 조회
   */
  async findAll(status?: IssueStatus): Promise<RentalIssue[]> {
    const query = this.rentalIssueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.rental', 'rental')
      .leftJoinAndSelect('rental.asset', 'asset')
      .leftJoinAndSelect('asset.product', 'product')
      .leftJoinAndSelect('rental.order', 'order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .orderBy('issue.createdAt', 'DESC');

    if (status) {
      query.andWhere('issue.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * 렌탈별 이슈 조회
   */
  async findByRental(rentalId: string): Promise<RentalIssue[]> {
    return this.rentalIssueRepository.find({
      where: { rentalId },
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 이슈 상세 조회
   */
  async findOne(id: string): Promise<RentalIssue> {
    const issue = await this.rentalIssueRepository.findOne({
      where: { id },
      relations: [
        'rental',
        'rental.asset',
        'rental.asset.product',
        'rental.order',
        'rental.order.user',
        'reporter',
      ],
    });

    if (!issue) {
      throw new Error('Issue not found');
    }

    return issue;
  }

  /**
   * 이슈 상태 업데이트
   */
  async updateStatus(
    id: string,
    status: IssueStatus,
    resolutionNotes?: string,
  ): Promise<RentalIssue> {
    const issue = await this.findOne(id);

    issue.status = status;
    if (resolutionNotes) {
      issue.resolutionNotes = resolutionNotes;
    }

    return this.rentalIssueRepository.save(issue);
  }

  /**
   * 이슈 추가 청구액 설정
   */
  async setAdditionalCharge(
    id: string,
    additionalCharge: number,
  ): Promise<RentalIssue> {
    const issue = await this.findOne(id);

    issue.additionalCharge = additionalCharge;
    issue.status = IssueStatus.BILLED;

    return this.rentalIssueRepository.save(issue);
  }

  /**
   * 이슈 증거 사진 추가
   */
  async addEvidencePhotos(id: string, photoUrls: string[]): Promise<RentalIssue> {
    const issue = await this.findOne(id);

    const currentPhotos = issue.evidencePhotos || [];
    issue.evidencePhotos = [...currentPhotos, ...photoUrls];

    return this.rentalIssueRepository.save(issue);
  }

  /**
   * 이슈 해결
   */
  async resolve(
    id: string,
    resolutionNotes: string,
  ): Promise<RentalIssue> {
    const issue = await this.findOne(id);

    issue.status = IssueStatus.RESOLVED;
    issue.resolutionNotes = resolutionNotes;

    return this.rentalIssueRepository.save(issue);
  }

  /**
   * 이슈 통계
   */
  async getStats(): Promise<{
    totalIssues: number;
    byType: Record<IssueType, number>;
    bySeverity: Record<IssueSeverity, number>;
    byStatus: Record<IssueStatus, number>;
    totalAdditionalCharges: number;
  }> {
    const issues = await this.rentalIssueRepository.find();

    const stats = {
      totalIssues: issues.length,
      byType: {
        [IssueType.DAMAGE]: 0,
        [IssueType.DELAY]: 0,
        [IssueType.LOSS]: 0,
      },
      bySeverity: {
        [IssueSeverity.MINOR]: 0,
        [IssueSeverity.MAJOR]: 0,
        [IssueSeverity.TOTAL_LOSS]: 0,
      },
      byStatus: {
        [IssueStatus.DETECTED]: 0,
        [IssueStatus.NOTIFIED]: 0,
        [IssueStatus.NEGOTIATING]: 0,
        [IssueStatus.RESOLVED]: 0,
        [IssueStatus.BILLED]: 0,
        [IssueStatus.PAID]: 0,
      },
      totalAdditionalCharges: 0,
    };

    issues.forEach((issue) => {
      stats.byType[issue.type]++;
      if (issue.severity) {
        stats.bySeverity[issue.severity]++;
      }
      stats.byStatus[issue.status]++;
      stats.totalAdditionalCharges += Number(issue.additionalCharge);
    });

    return stats;
  }
}
