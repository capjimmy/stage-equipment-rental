import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import {
  User,
  Product,
  Asset,
  Order,
  Rental,
  PaymentStatus,
  FulfillmentStatus,
  RentalStatus,
} from './entities';

async function seedRental() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('🌱 대여 시드 데이터 생성 시작...\n');

  const userRepo = dataSource.getRepository(User);
  const productRepo = dataSource.getRepository(Product);
  const assetRepo = dataSource.getRepository(Asset);
  const orderRepo = dataSource.getRepository(Order);
  const rentalRepo = dataSource.getRepository(Rental);

  // 1. 첫 번째 고객 가져오기
  const customer = await userRepo.findOne({
    where: { email: 'customer@example.com' },
  });

  if (!customer) {
    console.log('❌ 고객 정보를 찾을 수 없습니다. 먼저 seed.ts를 실행하세요.');
    await app.close();
    return;
  }

  console.log(`✅ 고객: ${customer.name} (${customer.email})`);

  // 2. 첫 번째 상품 가져오기
  const product = await productRepo.findOne({
    where: {},
    relations: ['assets'],
  });

  if (!product || !product.assets || product.assets.length === 0) {
    console.log('❌ 상품 또는 자산을 찾을 수 없습니다.');
    await app.close();
    return;
  }

  console.log(`✅ 상품: ${product.title}`);
  console.log(`✅ 자산 수: ${product.assets.length}\n`);

  // 3. 대여 기간 설정
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 대여 1: 오늘부터 5일간
  const rental1Start = new Date(today);
  const rental1End = new Date(today);
  rental1End.setDate(rental1End.getDate() + 4); // 5일간

  // 대여 2: 7일 후부터 3일간
  const rental2Start = new Date(today);
  rental2Start.setDate(rental2Start.getDate() + 7);
  const rental2End = new Date(rental2Start);
  rental2End.setDate(rental2End.getDate() + 2); // 3일간

  console.log('📅 대여 기간 설정:');
  console.log(`   대여1: ${rental1Start.toISOString().split('T')[0]} ~ ${rental1End.toISOString().split('T')[0]} (5일)`);
  console.log(`   대여2: ${rental2Start.toISOString().split('T')[0]} ~ ${rental2End.toISOString().split('T')[0]} (3일)\n`);

  // 4. 주문 1 생성
  console.log('📝 주문 1 생성 중...');
  const order1 = await orderRepo.save({
    userId: customer.id,
    startDate: rental1Start,
    endDate: rental1End,
    totalAmount: Number(product.baseDailyPrice) * 5,
    paymentMethod: 'bank_transfer',
    paymentStatus: PaymentStatus.CONFIRMED,
    fulfillmentStatus: FulfillmentStatus.CONFIRMED,
  });
  console.log(`✅ 주문 1 생성 완료 (ID: ${order1.id})`);

  // 5. 대여 1 생성 (첫 번째 자산)
  const asset1 = product.assets[0];
  const rental1BlockedEnd = new Date(rental1End);
  rental1BlockedEnd.setDate(rental1BlockedEnd.getDate() + 1); // 버퍼 1일

  console.log(`🔒 자산 "${asset1.assetCode}"에 대한 대여 1 생성 중...`);
  const rental1 = await rentalRepo.save({
    orderId: order1.id,
    assetId: asset1.id,
    startDate: rental1Start,
    endDate: rental1End,
    bufferDays: 1,
    blockedStart: rental1Start,
    blockedEnd: rental1BlockedEnd,
    status: RentalStatus.CONFIRMED,
  });
  console.log(`✅ 대여 1 생성 완료 (ID: ${rental1.id})\n`);

  // 6. 주문 2 생성
  console.log('📝 주문 2 생성 중...');
  const order2 = await orderRepo.save({
    userId: customer.id,
    startDate: rental2Start,
    endDate: rental2End,
    totalAmount: Number(product.baseDailyPrice) * 3,
    paymentMethod: 'bank_transfer',
    paymentStatus: PaymentStatus.PENDING,
    fulfillmentStatus: FulfillmentStatus.HOLD_PENDINGPAY,
  });
  console.log(`✅ 주문 2 생성 완료 (ID: ${order2.id})`);

  // 7. 대여 2 생성 (두 번째 자산)
  if (product.assets.length > 1) {
    const asset2 = product.assets[1];
    const rental2BlockedEnd = new Date(rental2End);
    rental2BlockedEnd.setDate(rental2BlockedEnd.getDate() + 1); // 버퍼 1일

    console.log(`🔒 자산 "${asset2.assetCode}"에 대한 대여 2 생성 중...`);
    const rental2 = await rentalRepo.save({
      orderId: order2.id,
      assetId: asset2.id,
      startDate: rental2Start,
      endDate: rental2End,
      bufferDays: 1,
      blockedStart: rental2Start,
      blockedEnd: rental2BlockedEnd,
      status: RentalStatus.HOLD_PENDINGPAY,
    });
    console.log(`✅ 대여 2 생성 완료 (ID: ${rental2.id})\n`);
  }

  // 8. 생성된 대여 확인
  console.log('🔍 차단 기간 조회 중...');
  const blockedPeriods = await rentalRepo
    .createQueryBuilder('rental')
    .leftJoin('rental.asset', 'asset')
    .where('asset.productId = :productId', { productId: product.id })
    .andWhere('rental.status IN (:...statuses)', {
      statuses: [
        RentalStatus.HOLD_PENDINGPAY,
        RentalStatus.CONFIRMED,
        RentalStatus.RENTED,
      ],
    })
    .andWhere('rental.blockedEnd >= :today', {
      today: today.toISOString().split('T')[0],
    })
    .select([
      'rental.id',
      'rental.blockedStart',
      'rental.blockedEnd',
      'rental.status',
      'asset.assetCode',
    ])
    .orderBy('rental.blockedStart', 'ASC')
    .getRawMany();

  console.log('\n📋 차단 기간 조회 결과:');
  blockedPeriods.forEach((period) => {
    console.log(`   - 자산: ${period.asset_assetCode}`);
    console.log(`     기간: ${period.rental_blockedStart} ~ ${period.rental_blockedEnd}`);
    console.log(`     상태: ${period.rental_status}\n`);
  });

  console.log('✅ 대여 시드 데이터 생성 완료!');
  console.log(`\n🌐 API 테스트:`);
  console.log(`   curl "http://localhost:3001/api/products/${product.id}/blocked-periods"`);

  await app.close();
}

seedRental().catch((error) => {
  console.error('❌ 대여 시드 데이터 생성 실패:', error);
  process.exit(1);
});
