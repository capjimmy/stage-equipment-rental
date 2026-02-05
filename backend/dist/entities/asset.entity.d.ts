import { Product } from './product.entity';
import { Rental } from './rental.entity';
export declare enum AssetConditionGrade {
    A = "A",
    B = "B",
    C = "C"
}
export declare enum AssetStatus {
    AVAILABLE = "available",
    RENTED = "rented",
    MAINTENANCE = "maintenance",
    INACTIVE = "inactive",
    LOST = "lost"
}
export declare class Asset {
    id: string;
    productId: string;
    product: Product;
    assetCode: string;
    conditionGrade: AssetConditionGrade;
    status: AssetStatus;
    notes: string;
    photos: string[];
    rentals: Rental[];
    createdAt: Date;
    updatedAt: Date;
}
