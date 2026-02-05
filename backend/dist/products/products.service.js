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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const product_blocked_period_entity_1 = require("../entities/product-blocked-period.entity");
const asset_entity_1 = require("../entities/asset.entity");
const rental_entity_1 = require("../entities/rental.entity");
const tag_entity_1 = require("../entities/tag.entity");
let ProductsService = class ProductsService {
    productRepository;
    blockedPeriodRepository;
    assetRepository;
    rentalRepository;
    tagRepository;
    constructor(productRepository, blockedPeriodRepository, assetRepository, rentalRepository, tagRepository) {
        this.productRepository = productRepository;
        this.blockedPeriodRepository = blockedPeriodRepository;
        this.assetRepository = assetRepository;
        this.rentalRepository = rentalRepository;
        this.tagRepository = tagRepository;
    }
    async findAll() {
        const products = await this.productRepository.find({
            where: { status: product_entity_1.ProductStatus.ACTIVE },
            relations: ['category', 'tags', 'assets', 'supplier'],
        });
        const productsWithAvailability = products.map((product) => ({
            ...product,
            availableCount: product.assets?.filter((a) => a.status === asset_entity_1.AssetStatus.AVAILABLE).length || 0,
        }));
        return productsWithAvailability;
    }
    async search(startDate, endDate, query, categoryId, includeUnavailable = false) {
        if (startDate || endDate) {
            if (!startDate || !endDate) {
                throw new common_1.BadRequestException('startDate와 endDate는 모두 제공되어야 합니다.');
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate)) {
                throw new common_1.BadRequestException('startDate의 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.');
            }
            if (!dateRegex.test(endDate)) {
                throw new common_1.BadRequestException('endDate의 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.');
            }
            const startDateObj = new Date(startDate);
            const endDateObj = new Date(endDate);
            if (isNaN(startDateObj.getTime())) {
                throw new common_1.BadRequestException('startDate가 유효한 날짜가 아닙니다.');
            }
            if (isNaN(endDateObj.getTime())) {
                throw new common_1.BadRequestException('endDate가 유효한 날짜가 아닙니다.');
            }
            if (endDateObj < startDateObj) {
                throw new common_1.BadRequestException('endDate는 startDate보다 이후여야 합니다.');
            }
        }
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.tags', 'tags')
            .leftJoinAndSelect('product.assets', 'assets')
            .leftJoinAndSelect('product.supplier', 'supplier')
            .where('product.status = :status', { status: product_entity_1.ProductStatus.ACTIVE });
        if (categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
        }
        if (query) {
            queryBuilder.andWhere('(product.title LIKE :query OR product.description LIKE :query OR tags.name LIKE :query OR category.name LIKE :query)', { query: `%${query}%` });
        }
        const products = await queryBuilder.getMany();
        if (startDate && endDate) {
            const productsWithAvailability = await Promise.all(products.map(async (product) => {
                const availableCount = await this.getAvailableAssetCount(product.id, startDate, endDate);
                return {
                    ...product,
                    availableCount,
                    isAvailable: availableCount > 0,
                };
            }));
            if (!includeUnavailable) {
                return productsWithAvailability.filter((p) => p.availableCount > 0);
            }
            return productsWithAvailability;
        }
        else {
            return products.map((product) => ({
                ...product,
                availableCount: product.assets?.filter((a) => a.status === asset_entity_1.AssetStatus.AVAILABLE).length || 0,
            }));
        }
    }
    async getAvailableAssetCount(productId, startDate, endDate) {
        const allAssets = await this.assetRepository.find({
            where: {
                productId,
                status: asset_entity_1.AssetStatus.AVAILABLE,
            },
        });
        const blockedAssets = await this.rentalRepository
            .createQueryBuilder('rental')
            .select('rental.assetId')
            .where('rental.assetId IN (:...assetIds)', {
            assetIds: allAssets.map((a) => a.id),
        })
            .andWhere('rental.status IN (:...statuses)', {
            statuses: [
                rental_entity_1.RentalStatus.HOLD_PENDINGPAY,
                rental_entity_1.RentalStatus.CONFIRMED,
                rental_entity_1.RentalStatus.RENTED,
            ],
        })
            .andWhere('NOT (rental.blockedEnd < :startDate OR rental.blockedStart > :endDate)', { startDate, endDate })
            .getRawMany();
        const blockedAssetIds = blockedAssets.map((r) => r.rental_assetId);
        return allAssets.filter((a) => !blockedAssetIds.includes(a.id)).length;
    }
    async findOne(id) {
        const product = await this.productRepository.findOne({
            where: { id },
            relations: ['category', 'tags', 'assets', 'supplier'],
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with ID "${id}" not found`);
        }
        const availableCount = product.assets?.filter((a) => a.status === asset_entity_1.AssetStatus.AVAILABLE).length || 0;
        return {
            ...product,
            availableCount,
        };
    }
    async getBlockedPeriods(productId) {
        const rentals = await this.rentalRepository
            .createQueryBuilder('rental')
            .leftJoin('rental.asset', 'asset')
            .where('asset.productId = :productId', { productId })
            .andWhere('rental.status IN (:...statuses)', {
            statuses: [
                rental_entity_1.RentalStatus.HOLD_PENDINGPAY,
                rental_entity_1.RentalStatus.CONFIRMED,
                rental_entity_1.RentalStatus.RENTED,
            ],
        })
            .andWhere('rental.blockedEnd >= :today', {
            today: new Date().toISOString().split('T')[0],
        })
            .select([
            'rental.blockedStart',
            'rental.blockedEnd',
            'rental.status',
        ])
            .orderBy('rental.blockedStart', 'ASC')
            .getRawMany();
        const manualBlocks = await this.blockedPeriodRepository.find({
            where: { productId },
            order: { blockedStart: 'ASC' },
        });
        const rentalPeriods = rentals.map((r) => ({
            type: 'rental',
            blockedStart: r.rental_blockedStart,
            blockedEnd: r.rental_blockedEnd,
            status: r.rental_status,
        }));
        const manualPeriods = manualBlocks.map((b) => ({
            type: 'manual',
            id: b.id,
            blockedStart: b.blockedStart,
            blockedEnd: b.blockedEnd,
            reason: b.reason,
        }));
        return [...rentalPeriods, ...manualPeriods].sort((a, b) => {
            return new Date(a.blockedStart).getTime() - new Date(b.blockedStart).getTime();
        });
    }
    async create(productData, supplierId) {
        const { tagIds, ...data } = productData;
        const product = this.productRepository.create({
            ...data,
            supplierId,
            status: data.status || product_entity_1.ProductStatus.ACTIVE,
        });
        const savedProduct = (await this.productRepository.save(product));
        if (tagIds && tagIds.length > 0) {
            const tags = await this.tagRepository.findBy({
                id: (0, typeorm_2.In)(tagIds),
            });
            savedProduct.tags = tags;
            return (await this.productRepository.save(savedProduct));
        }
        return savedProduct;
    }
    async update(id, productData) {
        const { tagIds, ...data } = productData;
        await this.productRepository.update(id, data);
        if (tagIds && tagIds.length > 0) {
            const product = await this.productRepository.findOne({
                where: { id },
                relations: ['tags'],
            });
            if (product) {
                const tags = await this.tagRepository.findBy({
                    id: (0, typeorm_2.In)(tagIds),
                });
                product.tags = tags;
                await this.productRepository.save(product);
            }
        }
        return this.findOne(id);
    }
    async delete(id) {
        await this.productRepository.delete(id);
    }
    async addBlockedPeriod(productId, blockedStart, blockedEnd, reason, createdBy) {
        const blockedPeriod = this.blockedPeriodRepository.create({
            productId,
            blockedStart: new Date(blockedStart),
            blockedEnd: new Date(blockedEnd),
            reason,
            createdBy,
        });
        return await this.blockedPeriodRepository.save(blockedPeriod);
    }
    async deleteBlockedPeriod(productId, periodId) {
        const result = await this.blockedPeriodRepository.delete({
            id: periodId,
            productId,
        });
        return (result.affected ?? 0) > 0;
    }
    async getManualBlockedPeriods(productId) {
        return await this.blockedPeriodRepository.find({
            where: { productId },
            order: { blockedStart: 'ASC' },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(product_blocked_period_entity_1.ProductBlockedPeriod)),
    __param(2, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __param(3, (0, typeorm_1.InjectRepository)(rental_entity_1.Rental)),
    __param(4, (0, typeorm_1.InjectRepository)(tag_entity_1.Tag)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map