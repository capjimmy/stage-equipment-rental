import { ProductsService } from './products.service';
export declare class ProductsController {
    private productsService;
    constructor(productsService: ProductsService);
    findAll(): Promise<{
        availableCount: number;
        id: string;
        supplierId: string;
        supplier: import("../entities/user.entity").User;
        title: string;
        description: string;
        images: string[];
        detailImages: string[];
        categoryId: string;
        category: import("../entities").Category;
        baseDailyPrice: number;
        status: import("../entities").ProductStatus;
        tags: import("../entities").Tag[];
        assets: import("../entities").Asset[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    search(startDate?: string, endDate?: string, query?: string, categoryId?: string, includeUnavailable?: string): Promise<{
        availableCount: number;
        id: string;
        supplierId: string;
        supplier: import("../entities/user.entity").User;
        title: string;
        description: string;
        images: string[];
        detailImages: string[];
        categoryId: string;
        category: import("../entities").Category;
        baseDailyPrice: number;
        status: import("../entities").ProductStatus;
        tags: import("../entities").Tag[];
        assets: import("../entities").Asset[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        availableCount: number;
        id: string;
        supplierId: string;
        supplier: import("../entities/user.entity").User;
        title: string;
        description: string;
        images: string[];
        detailImages: string[];
        categoryId: string;
        category: import("../entities").Category;
        baseDailyPrice: number;
        status: import("../entities").ProductStatus;
        tags: import("../entities").Tag[];
        assets: import("../entities").Asset[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    getBlockedPeriods(id: string): Promise<({
        type: string;
        blockedStart: any;
        blockedEnd: any;
        status: any;
    } | {
        type: string;
        id: string;
        blockedStart: Date;
        blockedEnd: Date;
        reason: string;
    })[]>;
    create(req: any, productData: any): Promise<import("../entities").Product>;
    update(id: string, productData: any): Promise<{
        availableCount: number;
        id: string;
        supplierId: string;
        supplier: import("../entities/user.entity").User;
        title: string;
        description: string;
        images: string[];
        detailImages: string[];
        categoryId: string;
        category: import("../entities").Category;
        baseDailyPrice: number;
        status: import("../entities").ProductStatus;
        tags: import("../entities").Tag[];
        assets: import("../entities").Asset[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(id: string): Promise<void>;
    addBlockedPeriod(productId: string, body: {
        blockedStart: string;
        blockedEnd: string;
        reason?: string;
    }, req: any): Promise<import("../entities").ProductBlockedPeriod>;
    deleteBlockedPeriod(productId: string, periodId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
