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
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cart_entity_1 = require("../entities/cart.entity");
const cart_item_entity_1 = require("../entities/cart-item.entity");
const product_entity_1 = require("../entities/product.entity");
const asset_entity_1 = require("../entities/asset.entity");
const rental_entity_1 = require("../entities/rental.entity");
let CartService = class CartService {
    cartRepository;
    cartItemRepository;
    productRepository;
    assetRepository;
    rentalRepository;
    constructor(cartRepository, cartItemRepository, productRepository, assetRepository, rentalRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.assetRepository = assetRepository;
        this.rentalRepository = rentalRepository;
    }
    async getCart(userId) {
        let cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items', 'items.product', 'items.product.category'],
        });
        if (!cart) {
            cart = this.cartRepository.create({
                userId,
                items: [],
            });
            cart = await this.cartRepository.save(cart);
        }
        return cart;
    }
    async addItem(userId, productId, quantity, startDate, endDate) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
        });
        if (!product) {
            throw new common_1.BadRequestException('상품을 찾을 수 없습니다');
        }
        const availableCount = await this.getAvailableAssetCount(productId, startDate, endDate);
        if (availableCount < quantity) {
            throw new common_1.BadRequestException(`선택한 기간(${startDate} ~ ${endDate})에 대여 가능한 수량이 부족합니다. (가능: ${availableCount}개, 요청: ${quantity}개)`);
        }
        let cart = await this.getCart(userId);
        const existingItem = cart.items?.find((item) => item.productId === productId &&
            item.startDate === startDate &&
            item.endDate === endDate);
        if (existingItem) {
            const totalQuantity = existingItem.quantity + quantity;
            if (totalQuantity > availableCount) {
                throw new common_1.BadRequestException(`선택한 기간에 대여 가능한 수량을 초과합니다. (가능: ${availableCount}개, 장바구니: ${existingItem.quantity}개, 추가 요청: ${quantity}개)`);
            }
            existingItem.quantity = totalQuantity;
            await this.cartItemRepository.save(existingItem);
        }
        else {
            const newItem = this.cartItemRepository.create({
                cartId: cart.id,
                productId,
                quantity,
                startDate,
                endDate,
            });
            await this.cartItemRepository.save(newItem);
        }
        return this.getCart(userId);
    }
    async getAvailableAssetCount(productId, startDate, endDate) {
        const allAssets = await this.assetRepository.find({
            where: {
                productId,
                status: asset_entity_1.AssetStatus.AVAILABLE,
            },
        });
        if (allAssets.length === 0) {
            return 0;
        }
        const blockedAssets = await this.rentalRepository
            .createQueryBuilder('rental')
            .select('rental.assetId')
            .where('rental.assetId IN (:...assetIds)', {
            assetIds: allAssets.map((a) => a.id),
        })
            .andWhere('rental.status IN (:...statuses)', {
            statuses: [
                rental_entity_1.RentalStatus.REQUESTED,
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
    async updateQuantity(userId, itemId, quantity) {
        const cart = await this.getCart(userId);
        const item = cart.items?.find((i) => i.id === itemId);
        if (!item) {
            throw new Error('Cart item not found');
        }
        item.quantity = quantity;
        await this.cartItemRepository.save(item);
        return this.getCart(userId);
    }
    async removeItem(userId, itemId) {
        const cart = await this.getCart(userId);
        const item = cart.items?.find((i) => i.id === itemId);
        if (!item) {
            throw new Error('Cart item not found');
        }
        await this.cartItemRepository.remove(item);
        return this.getCart(userId);
    }
    async clearCart(userId) {
        const cart = await this.getCart(userId);
        if (cart.items && cart.items.length > 0) {
            await this.cartItemRepository.remove(cart.items);
        }
        return this.getCart(userId);
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(1, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(2, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __param(4, (0, typeorm_1.InjectRepository)(rental_entity_1.Rental)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CartService);
//# sourceMappingURL=cart.service.js.map