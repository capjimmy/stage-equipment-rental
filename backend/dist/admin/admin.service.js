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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const order_entity_1 = require("../entities/order.entity");
const user_entity_1 = require("../entities/user.entity");
let AdminService = class AdminService {
    productRepository;
    orderRepository;
    userRepository;
    constructor(productRepository, orderRepository, userRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }
    async getDashboardStats() {
        const [totalProducts, activeProducts, totalOrders, pendingOrders, confirmedOrders, completedOrders, totalUsers, recentOrders, recentProducts,] = await Promise.all([
            this.productRepository.count(),
            this.productRepository.count({ where: { status: product_entity_1.ProductStatus.ACTIVE } }),
            this.orderRepository.count(),
            this.orderRepository.count({ where: { paymentStatus: order_entity_1.PaymentStatus.PENDING } }),
            this.orderRepository.count({ where: { paymentStatus: order_entity_1.PaymentStatus.CONFIRMED } }),
            this.orderRepository.count({ where: { fulfillmentStatus: order_entity_1.FulfillmentStatus.RETURNED } }),
            this.userRepository.count(),
            this.orderRepository.find({
                relations: ['user'],
                order: { createdAt: 'DESC' },
                take: 5,
            }),
            this.productRepository.find({
                relations: ['category'],
                order: { createdAt: 'DESC' },
                take: 5,
            }),
        ]);
        const completedOrdersData = await this.orderRepository.find({
            where: { fulfillmentStatus: order_entity_1.FulfillmentStatus.RETURNED },
        });
        const totalRevenue = completedOrdersData.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
        return {
            totalProducts,
            activeProducts,
            totalOrders,
            pendingOrders,
            confirmedOrders,
            completedOrders,
            totalUsers,
            totalRevenue,
            recentOrders,
            recentProducts,
        };
    }
    async getAllProducts(params) {
        const query = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.assets', 'assets')
            .leftJoinAndSelect('product.tags', 'tags')
            .orderBy('product.createdAt', 'DESC');
        if (params.status) {
            query.andWhere('product.status = :status', { status: params.status });
        }
        if (params.categoryId) {
            query.andWhere('product.categoryId = :categoryId', {
                categoryId: params.categoryId,
            });
        }
        return query.getMany();
    }
    async getAllOrders(params) {
        const query = this.orderRepository
            .createQueryBuilder('order')
            .leftJoinAndSelect('order.user', 'user')
            .leftJoinAndSelect('order.rentals', 'rentals')
            .leftJoinAndSelect('rentals.asset', 'asset')
            .leftJoinAndSelect('asset.product', 'product')
            .orderBy('order.createdAt', 'DESC');
        if (params.status) {
            query.andWhere('order.fulfillmentStatus = :status', { status: params.status });
        }
        return query.getMany();
    }
    async getAllUsers(params) {
        const query = this.userRepository
            .createQueryBuilder('user')
            .orderBy('user.createdAt', 'DESC');
        if (params.role) {
            query.andWhere('user.role = :role', { role: params.role });
        }
        if (params.status) {
            query.andWhere('user.status = :status', { status: params.status });
        }
        return query.getMany();
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
//# sourceMappingURL=admin.service.js.map