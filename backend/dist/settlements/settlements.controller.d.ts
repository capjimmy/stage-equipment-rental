import { SettlementsService } from './settlements.service';
import { SettlementStatus } from '../entities/settlement.entity';
export declare class SettlementsController {
    private settlementsService;
    constructor(settlementsService: SettlementsService);
    getMySettlements(req: any, status?: SettlementStatus): Promise<import("../entities/settlement.entity").Settlement[]>;
    getMyStats(req: any): Promise<{
        totalPending: number;
        totalConfirmed: number;
        totalPaid: number;
        totalEarnings: number;
    }>;
    getAllSettlements(status?: SettlementStatus): Promise<import("../entities/settlement.entity").Settlement[]>;
    getPlatformStats(): Promise<{
        totalPlatformFee: number;
        totalSupplierAmount: number;
        totalGross: number;
    }>;
    getSettlement(id: string): Promise<import("../entities/settlement.entity").Settlement>;
    confirmSettlement(id: string): Promise<import("../entities/settlement.entity").Settlement>;
    markAsPaid(id: string): Promise<import("../entities/settlement.entity").Settlement>;
}
