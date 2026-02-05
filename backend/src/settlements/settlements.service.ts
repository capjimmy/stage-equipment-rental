import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settlement, SettlementType, SettlementStatus } from '../entities/settlement.entity';
import { Order } from '../entities/order.entity';
import { Rental } from '../entities/rental.entity';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(Settlement)
    private settlementRepository: Repository<Settlement>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
  ) {}

  /**
   * 주문 완료 시 정산 생성
   */
  async createFromOrder(orderId: string): Promise<Settlement[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['rentals', 'rentals.asset', 'rentals.asset.product'],
    });

    if (!order || !order.rentals) {
      throw new Error('Order or rentals not found');
    }

    const settlements: Settlement[] = [];
    const supplierSettlements: Map<string, number> = new Map();

    // 공급자별로 렌탈 금액 합산
    for (const rental of order.rentals) {
      const supplierId = rental.asset.product.supplierId;

      // 렌탈 금액 계산
      const days = Math.ceil(
        (new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const rentalAmount = Number(rental.asset.product.baseDailyPrice) * days;

      const currentAmount = supplierSettlements.get(supplierId) || 0;
      supplierSettlements.set(supplierId, currentAmount + rentalAmount);
    }

    // 공급자별로 정산 생성
    for (const [supplierId, grossAmount] of supplierSettlements.entries()) {
      // 렌탈료는 50:50 분배
      const platformFeeAmount = grossAmount * 0.5;
      const supplierAmount = grossAmount * 0.5;

      const settlement = this.settlementRepository.create({
        supplierId,
        orderId: order.id,
        type: SettlementType.RENTAL,
        grossAmount,
        platformFeeAmount,
        supplierAmount,
        status: SettlementStatus.PENDING,
      });

      settlements.push(await this.settlementRepository.save(settlement));
    }

    return settlements;
  }

  /**
   * 이슈로 인한 정산 생성 (공급자 100%)
   */
  async createFromIssue(
    rentalId: string,
    issueAmount: number,
  ): Promise<Settlement> {
    const rental = await this.rentalRepository.findOne({
      where: { id: rentalId },
      relations: ['asset', 'asset.product'],
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const settlement = this.settlementRepository.create({
      supplierId: rental.asset.product.supplierId,
      rentalId: rental.id,
      type: SettlementType.ISSUE,
      grossAmount: issueAmount,
      platformFeeAmount: 0, // 이슈는 공급자 100%
      supplierAmount: issueAmount,
      status: SettlementStatus.PENDING,
    });

    return this.settlementRepository.save(settlement);
  }

  /**
   * 공급자의 정산 목록 조회
   */
  async findBySupplier(
    supplierId: string,
    status?: SettlementStatus,
  ): Promise<Settlement[]> {
    const query = this.settlementRepository
      .createQueryBuilder('settlement')
      .leftJoinAndSelect('settlement.order', 'order')
      .leftJoinAndSelect('settlement.rental', 'rental')
      .leftJoinAndSelect('rental.asset', 'asset')
      .leftJoinAndSelect('asset.product', 'product')
      .where('settlement.supplierId = :supplierId', { supplierId })
      .orderBy('settlement.createdAt', 'DESC');

    if (status) {
      query.andWhere('settlement.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * 관리자: 모든 정산 조회
   */
  async findAll(status?: SettlementStatus): Promise<Settlement[]> {
    const query = this.settlementRepository
      .createQueryBuilder('settlement')
      .leftJoinAndSelect('settlement.supplier', 'supplier')
      .leftJoinAndSelect('settlement.order', 'order')
      .leftJoinAndSelect('settlement.rental', 'rental')
      .leftJoinAndSelect('rental.asset', 'asset')
      .leftJoinAndSelect('asset.product', 'product')
      .orderBy('settlement.createdAt', 'DESC');

    if (status) {
      query.andWhere('settlement.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * 정산 상세 조회
   */
  async findOne(id: string): Promise<Settlement> {
    const settlement = await this.settlementRepository.findOne({
      where: { id },
      relations: ['supplier', 'order', 'rental', 'rental.asset', 'rental.asset.product'],
    });

    if (!settlement) {
      throw new Error('Settlement not found');
    }

    return settlement;
  }

  /**
   * 정산 확정
   */
  async confirm(id: string): Promise<Settlement> {
    const settlement = await this.findOne(id);

    settlement.status = SettlementStatus.CONFIRMED;
    settlement.settlementDate = new Date();

    return this.settlementRepository.save(settlement);
  }

  /**
   * 정산 완료 (지급 완료)
   */
  async markAsPaid(id: string): Promise<Settlement> {
    const settlement = await this.findOne(id);

    if (settlement.status !== SettlementStatus.CONFIRMED) {
      throw new Error('Settlement must be confirmed before marking as paid');
    }

    settlement.status = SettlementStatus.PAID;

    return this.settlementRepository.save(settlement);
  }

  /**
   * 공급자별 정산 통계
   */
  async getSupplierStats(supplierId: string): Promise<{
    totalPending: number;
    totalConfirmed: number;
    totalPaid: number;
    totalEarnings: number;
  }> {
    const settlements = await this.settlementRepository.find({
      where: { supplierId },
    });

    const stats = settlements.reduce(
      (acc, settlement) => {
        const amount = Number(settlement.supplierAmount);

        if (settlement.status === SettlementStatus.PENDING) {
          acc.totalPending += amount;
        } else if (settlement.status === SettlementStatus.CONFIRMED) {
          acc.totalConfirmed += amount;
        } else if (settlement.status === SettlementStatus.PAID) {
          acc.totalPaid += amount;
        }

        acc.totalEarnings += amount;

        return acc;
      },
      {
        totalPending: 0,
        totalConfirmed: 0,
        totalPaid: 0,
        totalEarnings: 0,
      },
    );

    return stats;
  }

  /**
   * 플랫폼 수익 통계 (관리자용)
   */
  async getPlatformStats(): Promise<{
    totalPlatformFee: number;
    totalSupplierAmount: number;
    totalGross: number;
  }> {
    const settlements = await this.settlementRepository.find();

    const stats = settlements.reduce(
      (acc, settlement) => {
        acc.totalPlatformFee += Number(settlement.platformFeeAmount);
        acc.totalSupplierAmount += Number(settlement.supplierAmount);
        acc.totalGross += Number(settlement.grossAmount);
        return acc;
      },
      {
        totalPlatformFee: 0,
        totalSupplierAmount: 0,
        totalGross: 0,
      },
    );

    return stats;
  }
}
