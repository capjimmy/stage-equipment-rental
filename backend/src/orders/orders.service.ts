import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Order, PaymentStatus, FulfillmentStatus } from '../entities/order.entity';
import { Rental, RentalStatus } from '../entities/rental.entity';
import { Asset, AssetStatus } from '../entities/asset.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * 장바구니에서 주문 생성
   */
  async createFromCart(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    // 1. 장바구니 조회
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product', 'items.product.assets'],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('장바구니가 비어있습니다');
    }

    // 2. 날짜 검증
    const startDate = new Date(createOrderDto.startDate);
    const endDate = new Date(createOrderDto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('종료일은 시작일보다 나중이어야 합니다');
    }

    // 3. 각 상품에 대해 사용 가능한 에셋 확인 및 예약
    const rentals: Partial<Rental>[] = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const { product, quantity, startDate, endDate } = cartItem;

      // CartItem의 날짜를 Date 객체로 변환
      const itemStartDate = new Date(startDate);
      const itemEndDate = new Date(endDate);

      // 기간 계산
      const days = Math.ceil((itemEndDate.getTime() - itemStartDate.getTime()) / (1000 * 60 * 60 * 24));

      // 가격 계산
      const itemPrice = Number(product.baseDailyPrice) * days * quantity;
      totalAmount += itemPrice;

      // 사용 가능한 에셋 찾기
      const availableAssets = await this.findAvailableAssets(
        product.id,
        itemStartDate,
        itemEndDate,
        quantity
      );

      if (availableAssets.length < quantity) {
        throw new BadRequestException(
          `${product.title}의 사용 가능한 수량이 부족합니다. ` +
          `(필요: ${quantity}개, 사용 가능: ${availableAssets.length}개)`
        );
      }

      // 렌탈 항목 생성 (여러 개의 동일 상품도 하나의 렌탈로 관리)
      const asset = availableAssets[0]; // 첫 번째 자산 사용
      const bufferDays = 1; // 기본 버퍼 1일

      rentals.push({
        assetId: asset.id,
        startDate: itemStartDate,
        endDate: itemEndDate,
        bufferDays,
        blockedStart: itemStartDate,
        blockedEnd: new Date(itemEndDate.getTime() + bufferDays * 24 * 60 * 60 * 1000),
        status: RentalStatus.REQUESTED,
        quantity: quantity,
        rentalRate: Number(product.baseDailyPrice),
      });
    }

    // 4. 주문 생성
    const order = this.orderRepository.create({
      userId,
      startDate,
      endDate,
      totalAmount,
      paymentMethod: createOrderDto.paymentMethod || 'bank_transfer',
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: FulfillmentStatus.REQUESTED,
      deliveryMethod: createOrderDto.deliveryMethod,
      shippingAddress: createOrderDto.shippingAddress,
      deliveryNotes: createOrderDto.deliveryNotes,
      shippingCost: this.calculateShippingCost(createOrderDto.deliveryMethod),
      // 입금 마감일: 주문 후 24시간
      depositDeadlineAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    order.totalAmount = Number(order.totalAmount) + Number(order.shippingCost);

    const savedOrder = await this.orderRepository.save(order);

    // 5. 렌탈 생성
    for (const rentalData of rentals) {
      const rental = this.rentalRepository.create({
        ...rentalData,
        orderId: savedOrder.id,
      });
      await this.rentalRepository.save(rental);
    }

    // 6. 장바구니 비우기
    await this.cartItemRepository.delete({ cartId: cart.id });

    // 7. 관리자에게 예약 신청 알림 전송
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    for (const admin of admins) {
      await this.notificationsService.create(
        admin.id,
        'NEW_ORDER' as any,
        '새로운 예약 신청이 접수되었습니다',
        `주문 번호 ${savedOrder.id}의 예약 신청이 접수되었습니다. 입금 확인 후 승인해주세요.`,
        savedOrder.id,
      );
    }

    // 8. 완성된 주문 반환
    return this.findOne(savedOrder.id, userId);
  }

  /**
   * 사용 가능한 에셋 찾기 (대여 기간 충돌 체크)
   */
  private async findAvailableAssets(
    productId: string,
    startDate: Date,
    endDate: Date,
    requiredCount: number
  ): Promise<Asset[]> {
    // 해당 상품의 모든 에셋
    const allAssets = await this.assetRepository.find({
      where: { productId, status: AssetStatus.AVAILABLE },
    });

    const availableAssets: Asset[] = [];

    for (const asset of allAssets) {
      // 이 에셋의 겹치는 렌탈 확인
      const overlappingRentals = await this.rentalRepository.count({
        where: [
          {
            assetId: asset.id,
            blockedStart: LessThanOrEqual(endDate),
            blockedEnd: MoreThanOrEqual(startDate),
            status: Between(RentalStatus.REQUESTED, RentalStatus.RENTED) as any,
          },
        ],
      });

      if (overlappingRentals === 0) {
        availableAssets.push(asset);

        if (availableAssets.length >= requiredCount) {
          break;
        }
      }
    }

    return availableAssets;
  }

  /**
   * 배송비 계산
   */
  private calculateShippingCost(deliveryMethod?: string): number {
    switch (deliveryMethod) {
      case 'quick':
        return 15000;
      case 'parcel':
        return 5000;
      case 'bundle':
        return 0;
      default:
        return 5000;
    }
  }

  /**
   * 내 주문 목록 조회
   */
  async findMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['rentals', 'rentals.asset', 'rentals.asset.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 주문 상세 조회
   */
  async findOne(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
      relations: [
        'rentals',
        'rentals.asset',
        'rentals.asset.product',
        'rentals.asset.product.category',
        'user',
      ],
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다');
    }

    return order;
  }

  /**
   * 관리자: 모든 주문 조회
   */
  async findAll(status?: FulfillmentStatus): Promise<Order[]> {
    const where: any = {};
    if (status) {
      where.fulfillmentStatus = status;
    }

    return this.orderRepository.find({
      where,
      relations: ['user', 'rentals', 'rentals.asset', 'rentals.asset.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 주문 취소
   */
  async cancel(orderId: string, userId: string, reason: string): Promise<Order> {
    const order = await this.findOne(orderId, userId);

    if (order.fulfillmentStatus !== FulfillmentStatus.REQUESTED &&
        order.fulfillmentStatus !== FulfillmentStatus.HOLD_PENDINGPAY) {
      throw new BadRequestException('이미 처리 중인 주문은 취소할 수 없습니다');
    }

    // 환불율 계산 (주문 후 24시간 이내 100%, 이후 차등 적용)
    const hoursSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
    let refundRate = 100;

    if (hoursSinceOrder > 24) {
      refundRate = 50; // 24시간 이후 50% 환불
    }

    const refundAmount = (Number(order.totalAmount) * refundRate) / 100;
    const cancellationFee = Number(order.totalAmount) - refundAmount;

    order.fulfillmentStatus = FulfillmentStatus.CANCELED;
    order.canceledAt = new Date();
    order.canceledBy = userId;
    order.cancellationReason = reason;
    order.refundRate = refundRate;
    order.refundAmount = refundAmount;
    order.cancellationFee = cancellationFee;

    // 렌탈 모두 취소
    for (const rental of order.rentals) {
      rental.status = RentalStatus.CANCELED;
      rental.cancelReason = reason;
      await this.rentalRepository.save(rental);
    }

    return this.orderRepository.save(order);
  }

  /**
   * 관리자: 주문 승인
   */
  async approve(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['rentals'],
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다');
    }

    order.fulfillmentStatus = FulfillmentStatus.CONFIRMED;
    order.adminApprovedAt1 = new Date();

    // 렌탈 상태 업데이트
    for (const rental of order.rentals) {
      rental.status = RentalStatus.CONFIRMED;
      await this.rentalRepository.save(rental);
    }

    return this.orderRepository.save(order);
  }

  /**
   * 관리자: 입금 확인
   */
  async confirmPayment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다');
    }

    order.paymentStatus = PaymentStatus.CONFIRMED;
    order.adminApprovedAt2 = new Date();
    order.fulfillmentStatus = FulfillmentStatus.CONFIRMED;

    return this.orderRepository.save(order);
  }

  /**
   * 관리자: 상품 발송
   */
  async dispatch(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다');
    }

    order.fulfillmentStatus = FulfillmentStatus.DISPATCHED;

    return this.orderRepository.save(order);
  }

  /**
   * 관리자: 상품 회수
   */
  async collect(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다');
    }

    order.fulfillmentStatus = FulfillmentStatus.RETURNED;

    return this.orderRepository.save(order);
  }
}
