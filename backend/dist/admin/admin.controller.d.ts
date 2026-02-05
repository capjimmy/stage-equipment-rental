import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboardStats(): Promise<{
        totalProducts: number;
        activeProducts: number;
        totalOrders: number;
        pendingOrders: number;
        confirmedOrders: number;
        completedOrders: number;
        totalUsers: number;
        totalRevenue: number;
        recentOrders: import("../entities").Order[];
        recentProducts: import("../entities").Product[];
    }>;
    getAllProducts(status?: string, categoryId?: string): Promise<import("../entities").Product[]>;
    getAllOrders(status?: string): Promise<import("../entities").Order[]>;
    getAllUsers(role?: string, status?: string): Promise<import("../entities/user.entity").User[]>;
}
