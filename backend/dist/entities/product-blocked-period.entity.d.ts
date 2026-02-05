import { Product } from './product.entity';
import { User } from './user.entity';
export declare class ProductBlockedPeriod {
    id: string;
    productId: string;
    product: Product;
    blockedStart: Date;
    blockedEnd: Date;
    reason: string;
    createdBy: string;
    creator: User;
    createdAt: Date;
}
