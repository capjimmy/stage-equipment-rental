import { CartService } from './cart.service';
export declare class CartController {
    private cartService;
    constructor(cartService: CartService);
    getCart(req: any): Promise<import("../entities").Cart>;
    addItem(req: any, data: {
        productId: string;
        quantity: number;
        startDate: string;
        endDate: string;
    }): Promise<import("../entities").Cart>;
    updateQuantity(req: any, itemId: string, quantity: number): Promise<import("../entities").Cart>;
    removeItem(req: any, itemId: string): Promise<import("../entities").Cart>;
    clearCart(req: any): Promise<import("../entities").Cart>;
}
