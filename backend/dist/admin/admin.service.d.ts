import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
export declare class AdminService {
    private productRepository;
    private orderRepository;
    private userRepository;
    constructor(productRepository: Repository<Product>, orderRepository: Repository<Order>, userRepository: Repository<User>);
    getDashboardStats(): Promise<{
        totalProducts: number;
        activeProducts: number;
        totalOrders: number;
        pendingOrders: number;
        confirmedOrders: number;
        completedOrders: number;
        totalUsers: number;
        totalRevenue: number;
        recentOrders: Order[];
        recentProducts: Product[];
    }>;
    getAllProducts(params: {
        status?: string;
        categoryId?: string;
    }): Promise<Product[]>;
    getAllOrders(params: {
        status?: string;
    }): Promise<Order[]>;
    getAllUsers(params: {
        role?: string;
        status?: string;
    }): Promise<User[]>;
}
