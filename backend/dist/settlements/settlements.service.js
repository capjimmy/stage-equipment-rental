"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const settlement_entity_1 = require("../entities/settlement.entity");
const order_entity_1 = require("../entities/order.entity");
const rental_entity_1 = require("../entities/rental.entity");
let SettlementsService = class SettlementsService {
    settlementRepository;
    orderRepository;
    rentalRepository;
    constructor(settlementRepository, orderRepository, rentalRepository) {
        this.settlementRepository = settlementRepository;
        this.orderRepository = orderRepository;
        this.rentalRepository = rentalRepository;
    }
    async createFromOrder(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['rentals', 'rentals.asset', 'rentals.asset.product'],
        });
        if (!order || !order.rentals) {
            throw new Error('Order or rentals not found');
        }
        const settlements = [];
        const supplierSettlements = new Map();
        for (const rental of order.rentals) {
            const supplierId = rental.asset.product.supplierId;
            const days = Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) /
                (1000 * 60 * 60 * 24));
            const rentalAmount = Number(rental.asset.product.baseDailyPrice) * days;
            const currentAmount = supplierSettlements.get(supplierId) || 0;
            supplierSettlements.set(supplierId, currentAmount + rentalAmount);
        }
        for (const [supplierId, grossAmount] of supplierSettlements.entries()) {
            const platformFeeAmount = grossAmount * 0.5;
            const supplierAmount = grossAmount * 0.5;
            const settlement = this.settlementRepository.create({
                supplierId,
                orderId: order.id,
                type: settlement_entity_1.SettlementType.RENTAL,
                grossAmount,
                platformFeeAmount,
                supplierAmount,
                status: settlement_entity_1.SettlementStatus.PENDING,
            });
            settlements.push(await this.settlementRepository.save(settlement));
        }
        return settlements;
    }
    async createFromIssue(rentalId, issueAmount) {
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
            type: settlement_entity_1.SettlementType.ISSUE,
            grossAmount: issueAmount,
            platformFeeAmount: 0,
            supplierAmount: issueAmount,
            status: settlement_entity_1.SettlementStatus.PENDING,
        });
        return this.settlementRepository.save(settlement);
    }
    async findBySupplier(supplierId, status) {
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
    async findAll(status) {
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
    async findOne(id) {
        const settlement = await this.settlementRepository.findOne({
            where: { id },
            relations: ['supplier', 'order', 'rental', 'rental.asset', 'rental.asset.product'],
        });
        if (!settlement) {
            throw new Error('Settlement not found');
        }
        return settlement;
    }
    async confirm(id) {
        const settlement = await this.findOne(id);
        settlement.status = settlement_entity_1.SettlementStatus.CONFIRMED;
        settlement.settlementDate = new Date();
        return this.settlementRepository.save(settlement);
    }
    async markAsPaid(id) {
        const settlement = await this.findOne(id);
        if (settlement.status !== settlement_entity_1.SettlementStatus.CONFIRMED) {
            throw new Error('Settlement must be confirmed before marking as paid');
        }
        settlement.status = settlement_entity_1.SettlementStatus.PAID;
        return this.settlementRepository.save(settlement);
    }
    async getSupplierStats(supplierId) {
        const settlements = await this.settlementRepository.find({
            where: { supplierId },
        });
        const stats = settlements.reduce((acc, settlement) => {
            const amount = Number(settlement.supplierAmount);
            if (settlement.status === settlement_entity_1.SettlementStatus.PENDING) {
                acc.totalPending += amount;
            }
            else if (settlement.status === settlement_entity_1.SettlementStatus.CONFIRMED) {
                acc.totalConfirmed += amount;
            }
            else if (settlement.status === settlement_entity_1.SettlementStatus.PAID) {
                acc.totalPaid += amount;
            }
            acc.totalEarnings += amount;
            return acc;
        }, {
            totalPending: 0,
            totalConfirmed: 0,
            totalPaid: 0,
            totalEarnings: 0,
        });
        return stats;
    }
    async getPlatformStats() {
        const settlements = await this.settlementRepository.find();
        const stats = settlements.reduce((acc, settlement) => {
            acc.totalPlatformFee += Number(settlement.platformFeeAmount);
            acc.totalSupplierAmount += Number(settlement.supplierAmount);
            acc.totalGross += Number(settlement.grossAmount);
            return acc;
        }, {
            totalPlatformFee: 0,
            totalSupplierAmount: 0,
            totalGross: 0,
        });
        return stats;
    }
};
exports.SettlementsService = SettlementsService;
exports.SettlementsService = SettlementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(settlement_entity_1.Settlement)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(rental_entity_1.Rental)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SettlementsService);
//# sourceMappingURL=settlements.service.js.map