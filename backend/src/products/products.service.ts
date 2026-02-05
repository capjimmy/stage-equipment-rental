import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Product, ProductStatus } from '../entities/product.entity';
import { ProductBlockedPeriod } from '../entities/product-blocked-period.entity';
import { Asset, AssetStatus } from '../entities/asset.entity';
import { Rental, RentalStatus } from '../entities/rental.entity';
import { Tag } from '../entities/tag.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductBlockedPeriod)
    private blockedPeriodRepository: Repository<ProductBlockedPeriod>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Rental)
    private rentalRepository: Repository<Rental>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  async findAll() {
    const products = await this.productRepository.find({
      where: { status: ProductStatus.ACTIVE },
      relations: ['category', 'tags', 'assets', 'supplier'],
    });

    // 각 상품의 대여 가능 수량 계산 (대략적인 계산)
    const productsWithAvailability = products.map((product) => ({
      ...product,
      availableCount: product.assets?.filter((a) => a.status === AssetStatus.AVAILABLE).length || 0,
    }));

    return productsWithAvailability;
  }

  async search(
    startDate?: string,
    endDate?: string,
    query?: string,
    categoryId?: string,
    includeUnavailable = false,
  ) {
    // 날짜 유효성 검증
    if (startDate || endDate) {
      // 두 날짜가 모두 제공되어야 함
      if (!startDate || !endDate) {
        throw new BadRequestException('startDate와 endDate는 모두 제공되어야 합니다.');
      }

      // 날짜 형식 검증 (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate)) {
        throw new BadRequestException('startDate의 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.');
      }
      if (!dateRegex.test(endDate)) {
        throw new BadRequestException('endDate의 형식이 올바르지 않습니다. YYYY-MM-DD 형식이어야 합니다.');
      }

      // 유효한 날짜인지 검증
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime())) {
        throw new BadRequestException('startDate가 유효한 날짜가 아닙니다.');
      }
      if (isNaN(endDateObj.getTime())) {
        throw new BadRequestException('endDate가 유효한 날짜가 아닙니다.');
      }

      // endDate가 startDate보다 이전인지 검증
      if (endDateObj < startDateObj) {
        throw new BadRequestException('endDate는 startDate보다 이후여야 합니다.');
      }
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.tags', 'tags')
      .leftJoinAndSelect('product.assets', 'assets')
      .leftJoinAndSelect('product.supplier', 'supplier')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    // 카테고리 필터
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    // 검색어 (상품명, 설명, 태그, 카테고리)
    if (query) {
      queryBuilder.andWhere(
        '(product.title LIKE :query OR product.description LIKE :query OR tags.name LIKE :query OR category.name LIKE :query)',
        { query: `%${query}%` },
      );
    }

    const products = await queryBuilder.getMany();

    // 날짜가 제공된 경우에만 대여 가능 수량 계산
    if (startDate && endDate) {
      // 각 상품의 대여 가능 수량 계산
      const productsWithAvailability = await Promise.all(
        products.map(async (product) => {
          const availableCount = await this.getAvailableAssetCount(
            product.id,
            startDate,
            endDate,
          );

          return {
            ...product,
            availableCount,
            isAvailable: availableCount > 0,
          };
        }),
      );

      // 대여 불가 상품 필터링
      if (!includeUnavailable) {
        return productsWithAvailability.filter((p) => p.availableCount > 0);
      }

      return productsWithAvailability;
    } else {
      // 날짜가 없으면 간단한 재고 수량만 반환
      return products.map((product) => ({
        ...product,
        availableCount: product.assets?.filter((a) => a.status === AssetStatus.AVAILABLE).length || 0,
      }));
    }
  }

  async getAvailableAssetCount(
    productId: string,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    // 해당 상품의 모든 자산 조회
    const allAssets = await this.assetRepository.find({
      where: {
        productId,
        status: AssetStatus.AVAILABLE,
      },
    });

    // 해당 기간에 대여 중인 자산 조회
    const blockedAssets = await this.rentalRepository
      .createQueryBuilder('rental')
      .select('rental.assetId')
      .where('rental.assetId IN (:...assetIds)', {
        assetIds: allAssets.map((a) => a.id),
      })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: [
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

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'tags', 'assets', 'supplier'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    // availableCount 계산
    const availableCount = product.assets?.filter((a) => a.status === AssetStatus.AVAILABLE).length || 0;

    return {
      ...product,
      availableCount,
    };
  }

  async getBlockedPeriods(productId: string) {
    // 1. 해당 상품의 모든 진행 중인 대여 정보 조회 (예약 기반 차단)
    const rentals = await this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoin('rental.asset', 'asset')
      .where('asset.productId = :productId', { productId })
      .andWhere('rental.status IN (:...statuses)', {
        statuses: [
          RentalStatus.HOLD_PENDINGPAY,
          RentalStatus.CONFIRMED,
          RentalStatus.RENTED,
        ],
      })
      .andWhere('rental.blockedEnd >= :today', {
        today: new Date().toISOString().split('T')[0],
      })
      .select([
        'rental.blockedStart',
        'rental.blockedEnd',
        'rental.status',
      ])
      .orderBy('rental.blockedStart', 'ASC')
      .getRawMany();

    // 2. 관리자가 설정한 수동 차단 기간 조회
    const manualBlocks = await this.blockedPeriodRepository.find({
      where: { productId },
      order: { blockedStart: 'ASC' },
    });

    // 3. 두 가지 차단 기간을 합쳐서 반환
    const rentalPeriods = rentals.map((r) => ({
      type: 'rental',
      blockedStart: r.rental_blockedStart,
      blockedEnd: r.rental_blockedEnd,
      status: r.rental_status,
    }));

    const manualPeriods = manualBlocks.map((b) => ({
      type: 'manual',
      id: b.id,
      blockedStart: b.blockedStart,
      blockedEnd: b.blockedEnd,
      reason: b.reason,
    }));

    // 시작 날짜 기준으로 정렬
    return [...rentalPeriods, ...manualPeriods].sort((a, b) => {
      return new Date(a.blockedStart).getTime() - new Date(b.blockedStart).getTime();
    });
  }

  async create(productData: any, supplierId: string): Promise<Product> {
    const { tagIds, ...data } = productData;

    // Create product
    const product = this.productRepository.create({
      ...data,
      supplierId,
      status: data.status || ProductStatus.ACTIVE,
    }) as unknown as Product;

    // Save product first
    const savedProduct = (await this.productRepository.save(product)) as unknown as Product;

    // If tagIds provided, fetch and attach tags
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({
        id: In(tagIds),
      });
      savedProduct.tags = tags;
      return (await this.productRepository.save(savedProduct)) as unknown as Product;
    }

    return savedProduct;
  }

  async update(id: string, productData: any) {
    const { tagIds, ...data } = productData;

    // Update regular columns
    await this.productRepository.update(id, data);

    // If tagIds provided, fetch and attach tags
    if (tagIds && tagIds.length > 0) {
      const product = await this.productRepository.findOne({
        where: { id },
        relations: ['tags'],
      });

      if (product) {
        const tags = await this.tagRepository.findBy({
          id: In(tagIds),
        });
        product.tags = tags;
        await this.productRepository.save(product);
      }
    }

    return this.findOne(id);
  }

  async delete(id: string) {
    await this.productRepository.delete(id);
  }

  // Blocked Period Management
  async addBlockedPeriod(
    productId: string,
    blockedStart: string,
    blockedEnd: string,
    reason: string,
    createdBy: string,
  ) {
    const blockedPeriod = this.blockedPeriodRepository.create({
      productId,
      blockedStart: new Date(blockedStart),
      blockedEnd: new Date(blockedEnd),
      reason,
      createdBy,
    });

    return await this.blockedPeriodRepository.save(blockedPeriod);
  }

  async deleteBlockedPeriod(productId: string, periodId: string) {
    const result = await this.blockedPeriodRepository.delete({
      id: periodId,
      productId,
    });

    return (result.affected ?? 0) > 0;
  }

  async getManualBlockedPeriods(productId: string) {
    return await this.blockedPeriodRepository.find({
      where: { productId },
      order: { blockedStart: 'ASC' },
    });
  }
}
