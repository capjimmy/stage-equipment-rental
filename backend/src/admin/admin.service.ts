import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { Order, PaymentStatus, FulfillmentStatus } from '../entities/order.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getDashboardStats() {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      confirmedOrders,
      completedOrders,
      totalUsers,
      recentOrders,
      recentProducts,
    ] = await Promise.all([
      this.productRepository.count(),
      this.productRepository.count({ where: { status: ProductStatus.ACTIVE } }),
      this.orderRepository.count(),
      this.orderRepository.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      this.orderRepository.count({ where: { paymentStatus: PaymentStatus.CONFIRMED } }),
      this.orderRepository.count({ where: { fulfillmentStatus: FulfillmentStatus.RETURNED } }),
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

    // Calculate total revenue from completed orders
    const completedOrdersData = await this.orderRepository.find({
      where: { fulfillmentStatus: FulfillmentStatus.RETURNED },
    });
    const totalRevenue = completedOrdersData.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0,
    );

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

  async getAllProducts(params: { status?: string; categoryId?: string }) {
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

  async getAllOrders(params: { status?: string }) {
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

  async getAllUsers(params: { role?: string; status?: string }) {
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
}
