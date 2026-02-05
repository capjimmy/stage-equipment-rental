import { User } from './user.entity';
import { CartItem } from './cart-item.entity';
export declare class Cart {
    id: string;
    userId: string;
    user: User;
    startDate: Date;
    endDate: Date;
    items: CartItem[];
    createdAt: Date;
    updatedAt: Date;
}
