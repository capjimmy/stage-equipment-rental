import { Cart } from './cart.entity';
import { Product } from './product.entity';
export declare class CartItem {
    id: string;
    cartId: string;
    cart: Cart;
    productId: string;
    product: Product;
    quantity: number;
    startDate: string;
    endDate: string;
    assignedAssetIds: string[];
    priceSnapshot: number;
    createdAt: Date;
    updatedAt: Date;
}
