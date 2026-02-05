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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../entities/order.entity");
const rental_entity_1 = require("../entities/rental.entity");
const asset_entity_1 = require("../entities/asset.entity");
const cart_entity_1 = require("../entities/cart.entity");
const cart_item_entity_1 = require("../entities/cart-item.entity");
const user_entity_1 = require("../entities/user.entity");
const notifications_service_1 = require("../notifications/notifications.service");
let OrdersService = class OrdersService {
    orderRepository;
    rentalRepository;
    assetRepository;
    cartRepository;
    cartItemRepository;
    userRepository;
    notificationsService;
    constructor(orderRepository, rentalRepository, assetRepository, cartRepository, cartItemRepository, userRepository, notificationsService) {
        this.orderRepository = orderRepository;
        this.rentalRepository = rentalRepository;
        this.assetRepository = assetRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.notificationsService = notificationsService;
    }
    async createFromCart(userId, createOrderDto) {
        const cart = await this.cartRepository.findOne({
            where: { userId },
            relations: ['items', 'items.product', 'items.product.assets'],
        });
        if (!cart || !cart.items || cart.items.length === 0) {
            throw new common_1.BadRequestException('장바구니가 비어있습니다');
        }
        const startDate = new Date(createOrderDto.startDate);
        const endDate = new Date(createOrderDto.endDate);
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('종료일은 시작일보다 나중이어야 합니다');
        }
        const rentals = [];
        let totalAmount = 0;
        for (const cartItem of cart.items) {
            const { product, quantity, startDate, endDate } = cartItem;
            const itemStartDate = new Date(startDate);
            const itemEndDate = new Date(endDate);
            const days = Math.ceil((itemEndDate.getTime() - itemStartDate.getTime()) / (1000 * 60 * 60 * 24));
            const itemPrice = Number(product.baseDailyPrice) * days * quantity;
            totalAmount += itemPrice;
            const availableAssets = await this.findAvailableAssets(product.id, itemStartDate, itemEndDate, quantity);
            if (availableAssets.length < quantity) {
                throw new common_1.BadRequestException(`${product.title}의 사용 가능한 수량이 부족합니다. ` +
                    `(필요: ${quantity}개, 사용 가능: ${availableAssets.length}개)`);
            }
            const asset = availableAssets[0];
            const bufferDays = 1;
            rentals.push({
                assetId: asset.id,
                startDate: itemStartDate,
                endDate: itemEndDate,
                bufferDays,
                blockedStart: itemStartDate,
                blockedEnd: new Date(itemEndDate.getTime() + bufferDays * 24 * 60 * 60 * 1000),
                status: rental_entity_1.RentalStatus.REQUESTED,
                quantity: quantity,
                rentalRate: Number(product.baseDailyPrice),
            });
        }
        const order = this.orderRepository.create({
            userId,
            startDate,
            endDate,
            totalAmount,
            paymentMethod: createOrderDto.paymentMethod || 'bank_transfer',
            paymentStatus: order_entity_1.PaymentStatus.PENDING,
            fulfillmentStatus: order_entity_1.FulfillmentStatus.REQUESTED,
            deliveryMethod: createOrderDto.deliveryMethod,
            shippingAddress: createOrderDto.shippingAddress,
            deliveryNotes: createOrderDto.deliveryNotes,
            shippingCost: this.calculateShippingCost(createOrderDto.deliveryMethod),
            depositDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        order.totalAmount = Number(order.totalAmount) + Number(order.shippingCost);
        const savedOrder = await this.orderRepository.save(order);
        for (const rentalData of rentals) {
            const rental = this.rentalRepository.create({
                ...rentalData,
                orderId: savedOrder.id,
            });
            await this.rentalRepository.save(rental);
        }
        await this.cartItemRepository.delete({ cartId: cart.id });
        const admins = await this.userRepository.find({
            where: { role: user_entity_1.UserRole.ADMIN },
        });
        for (const admin of admins) {
            await this.notificationsService.create(admin.id, 'NEW_ORDER', '새로운 예약 신청이 접수되었습니다', `주문 번호 ${savedOrder.id}의 예약 신청이 접수되었습니다. 입금 확인 후 승인해주세요.`, savedOrder.id);
        }
        return this.findOne(savedOrder.id, userId);
    }
    async findAvailableAssets(productId, startDate, endDate, requiredCount) {
        const allAssets = await this.assetRepository.find({
            where: { productId, status: asset_entity_1.AssetStatus.AVAILABLE },
        });
        const availableAssets = [];
        for (const asset of allAssets) {
            const overlappingRentals = await this.rentalRepository.count({
                where: [
                    {
                        assetId: asset.id,
                        blockedStart: (0, typeorm_2.LessThanOrEqual)(endDate),
                        blockedEnd: (0, typeorm_2.MoreThanOrEqual)(startDate),
                        status: (0, typeorm_2.Between)(rental_entity_1.RentalStatus.REQUESTED, rental_entity_1.RentalStatus.RENTED),
                    },
                ],
            });
            if (overlappingRentals === 0) {
                availableAssets.push(asset);
                if (availableAssets.length >= requiredCount) {
                    break;
                }
            }
        }
        return availableAssets;
    }
    calculateShippingCost(deliveryMethod) {
        switch (deliveryMethod) {
            case 'quick':
                return 15000;
            case 'parcel':
                return 5000;
            case 'bundle':
                return 0;
            default:
                return 5000;
        }
    }
    async findMyOrders(userId) {
        return this.orderRepository.find({
            where: { userId },
            relations: ['rentals', 'rentals.asset', 'rentals.asset.product'],
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(orderId, userId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
            relations: [
                'rentals',
                'rentals.asset',
                'rentals.asset.product',
                'rentals.asset.product.category',
                'user',
            ],
        });
        if (!order) {
            throw new common_1.NotFoundException('주문을 찾을 수 없습니다');
        }
        return order;
    }
    async findAll(status) {
        const where = {};
        if (status) {
            where.fulfillmentStatus = status;
        }
        return this.orderRepository.find({
            where,
            relations: ['user', 'rentals', 'rentals.asset', 'rentals.asset.product'],
            order: { createdAt: 'DESC' },
        });
    }
    async cancel(orderId, userId, reason) {
        const order = await this.findOne(orderId, userId);
        if (order.fulfillmentStatus !== order_entity_1.FulfillmentStatus.REQUESTED &&
            order.fulfillmentStatus !== order_entity_1.FulfillmentStatus.HOLD_PENDINGPAY) {
            throw new common_1.BadRequestException('이미 처리 중인 주문은 취소할 수 없습니다');
        }
        const hoursSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
        let refundRate = 100;
        if (hoursSinceOrder > 24) {
            refundRate = 50;
        }
        const refundAmount = (Number(order.totalAmount) * refundRate) / 100;
        const cancellationFee = Number(order.totalAmount) - refundAmount;
        order.fulfillmentStatus = order_entity_1.FulfillmentStatus.CANCELED;
        order.canceledAt = new Date();
        order.canceledBy = userId;
        order.cancellationReason = reason;
        order.refundRate = refundRate;
        order.refundAmount = refundAmount;
        order.cancellationFee = cancellationFee;
        for (const rental of order.rentals) {
            rental.status = rental_entity_1.RentalStatus.CANCELED;
            rental.cancelReason = reason;
            await this.rentalRepository.save(rental);
        }
        return this.orderRepository.save(order);
    }
    async approve(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['rentals'],
        });
        if (!order) {
            throw new common_1.NotFoundException('주문을 찾을 수 없습니다');
        }
        order.fulfillmentStatus = order_entity_1.FulfillmentStatus.CONFIRMED;
        order.adminApprovedAt1 = new Date();
        for (const rental of order.rentals) {
            rental.status = rental_entity_1.RentalStatus.CONFIRMED;
            await this.rentalRepository.save(rental);
        }
        return this.orderRepository.save(order);
    }
    async confirmPayment(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('주문을 찾을 수 없습니다');
        }
        order.paymentStatus = order_entity_1.PaymentStatus.CONFIRMED;
        order.adminApprovedAt2 = new Date();
        order.fulfillmentStatus = order_entity_1.FulfillmentStatus.CONFIRMED;
        return this.orderRepository.save(order);
    }
    async dispatch(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('주문을 찾을 수 없습니다');
        }
        order.fulfillmentStatus = order_entity_1.FulfillmentStatus.DISPATCHED;
        return this.orderRepository.save(order);
    }
    async collect(orderId) {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('주문을 찾을 수 없습니다');
        }
        order.fulfillmentStatus = order_entity_1.FulfillmentStatus.RETURNED;
        return this.orderRepository.save(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(rental_entity_1.Rental)),
    __param(2, (0, typeorm_1.InjectRepository)(asset_entity_1.Asset)),
    __param(3, (0, typeorm_1.InjectRepository)(cart_entity_1.Cart)),
    __param(4, (0, typeorm_1.InjectRepository)(cart_item_entity_1.CartItem)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_service_1.NotificationsService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map