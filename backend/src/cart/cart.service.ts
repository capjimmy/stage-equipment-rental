import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../entities/product.entity';
import { Asset, AssetStatus } from '../entities/asset.entity';
import { Rental, RentalStatus } from '../entities/rental.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.category'],
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        items: [],
      });
      cart = await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    startDate: string,
    endDate: string,
  ) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException('상품을 찾을 수 없습니다');
    }

    // 대여 가능 여부 검증
    const availableCount = await this.getAvailableAssetCount(
      productId,
      startDate,
      endDate,
    );

    if (availableCount < quantity) {
      throw new BadRequestException(
        `선택한 기간(${startDate} ~ ${endDate})에 대여 가능한 수량이 부족합니다. (가능: ${availableCount}개, 요청: ${quantity}개)`,
      );
    }

    let cart = await this.getCart(userId);

    // Check if item already exists with same dates
    const existingItem = cart.items?.find(
      (item) =>
        item.productId === productId &&
        item.startDate === startDate &&
        item.endDate === endDate,
    );

    if (existingItem) {
      // 기존 수량 + 추가 수량이 가용 수량을 초과하는지 확인
      const totalQuantity = existingItem.quantity + quantity;
      if (totalQuantity > availableCount) {
        throw new BadRequestException(
          `선택한 기간에 대여 가능한 수량을 초과합니다. (가능: ${availableCount}개, 장바구니: ${existingItem.quantity}개, 추가 요청: ${quantity}개)`,
        );
      }
      existingItem.quantity = totalQuantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const newItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
        startDate,
        endDate,
      });
      await this.cartItemRepository.save(newItem);
    }

    return this.getCart(userId);
  }

  /**
   * 특정 기간에 대여 가능한 자산 수 계산
   */
  private async getAvailableAssetCount(
    productId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    // 해당 상품의 모든 사용 가능한 자산 조회
    const allAssets = await this.assetRepository.find({
      where: {
        productId,
        status: AssetStatus.AVAILABLE,
      },
    });

    if (allAssets.length === 0) {
      return 0;
    }

    // 해당 기간에 예약된 자산 조회
    const blockedAssets = await this.rentalRepository
      .createQueryBuilder('rental')
      .select('rental.assetId')
      .where('rental.assetId IN (:...assetIds)', {
        assetIds: allAssets.map((a) => a.id),
      })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: [
          RentalStatus.REQUESTED,
          RentalStatus.HOLD_PENDINGPAY,
          RentalStatus.CONFIRMED,
          RentalStatus.RENTED,
        ],
      })
      .andWhere(
        'NOT (rental.blockedEnd < :startDate OR rental.blockedStart > :endDate)',
        { startDate, endDate },
      )
      .getRawMany();

    const blockedAssetIds = blockedAssets.map((r) => r.rental_assetId);
    return allAssets.filter((a) => !blockedAssetIds.includes(a.id)).length;
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      throw new Error('Cart item not found');
    }

    item.quantity = quantity;
    await this.cartItemRepository.save(item);

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getCart(userId);
    const item = cart.items?.find((i) => i.id === itemId);

    if (!item) {
      throw new Error('Cart item not found');
    }

    await this.cartItemRepository.remove(item);

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);

    if (cart.items && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    return this.getCart(userId);
  }
}
