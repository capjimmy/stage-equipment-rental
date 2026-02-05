import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { Asset } from '../entities/asset.entity';
import { Rental } from '../entities/rental.entity';
export declare class CartService {
    private cartRepository;
    private cartItemRepository;
    private productRepository;
    private assetRepository;
    private rentalRepository;
    constructor(cartRepository: Repository<Cart>, cartItemRepository: Repository<CartItem>, productRepository: Repository<Product>, assetRepository: Repository<Asset>, rentalRepository: Repository<Rental>);
    getCart(userId: string): Promise<Cart>;
    addItem(userId: string, productId: string, quantity: number, startDate: string, endDate: string): Promise<Cart>;
    private getAvailableAssetCount;
    updateQuantity(userId: string, itemId: string, quantity: number): Promise<Cart>;
    removeItem(userId: string, itemId: string): Promise<Cart>;
    clearCart(userId: string): Promise<Cart>;
}
