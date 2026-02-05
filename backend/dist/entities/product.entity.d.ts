import { User } from './user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Asset } from './asset.entity';
export declare enum ProductStatus {
    ACTIVE = "active",
    INACTIVE = "inactive"
}
export declare class Product {
    id: string;
    supplierId: string;
    supplier: User;
    title: string;
    description: string;
    images: string[];
    detailImages: string[];
    categoryId: string;
    category: Category;
    baseDailyPrice: number;
    status: ProductStatus;
    tags: Tag[];
    assets: Asset[];
    createdAt: Date;
    updatedAt: Date;
}
