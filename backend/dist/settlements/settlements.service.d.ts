import { Repository } from 'typeorm';
import { Settlement, SettlementStatus } from '../entities/settlement.entity';
import { Order } from '../entities/order.entity';
import { Rental } from '../entities/rental.entity';
export declare class SettlementsService {
    private settlementRepository;
    private orderRepository;
    private rentalRepository;
    constructor(settlementRepository: Repository<Settlement>, orderRepository: Repository<Order>, rentalRepository: Repository<Rental>);
    createFromOrder(orderId: string): Promise<Settlement[]>;
    createFromIssue(rentalId: string, issueAmount: number): Promise<Settlement>;
    findBySupplier(supplierId: string, status?: SettlementStatus): Promise<Settlement[]>;
    findAll(status?: SettlementStatus): Promise<Settlement[]>;
    findOne(id: string): Promise<Settlement>;
    confirm(id: string): Promise<Settlement>;
    markAsPaid(id: string): Promise<Settlement>;
    getSupplierStats(supplierId: string): Promise<{
        totalPending: number;
        totalConfirmed: number;
        totalPaid: number;
        totalEarnings: number;
    }>;
    getPlatformStats(): Promise<{
        totalPlatformFee: number;
        totalSupplierAmount: number;
        totalGross: number;
    }>;
}
