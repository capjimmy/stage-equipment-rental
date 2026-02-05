import { DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { Asset, AssetStatus, AssetConditionGrade } from './entities/asset.entity';
import { Order, PaymentStatus, FulfillmentStatus } from './entities/order.entity';
import { Rental, RentalStatus } from './entities/rental.entity';
import { User } from './entities/user.entity';

// 데이터베이스 연결 설정
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'stage_rental',
  entities: ['src/entities/*.entity.ts'],
  synchronize: false,
});

async function testScheduleSystem() {
  try {
    console.log('📦 데이터베이스 연결 중...');
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공\n');

    const productRepo = dataSource.getRepository(Product);
    const assetRepo = dataSource.getRepository(Asset);
    const orderRepo = dataSource.getRepository(Order);
    const rentalRepo = dataSource.getRepository(Rental);
    const userRepo = dataSource.getRepository(User);

    // 1. 첫 번째 상품 가져오기
    const products = await productRepo.find({ take: 1 });
    if (products.length === 0) {
      console.log('❌ 상품이 없습니다. 먼저 상품을 등록해주세요.');
      return;
    }
    const product = products[0];
    console.log(`📦 테스트 상품: ${product.title} (ID: ${product.id})\n`);

    // 2. 해당 상품의 자산(Asset) 확인
    let assets = await assetRepo.find({
      where: { productId: product.id },
    });

    console.log(`📊 현재 자산 수: ${assets.length}`);

    // 자산이 없으면 2개 생성
    if (assets.length === 0) {
      console.log('🔨 자산 2개 생성 중...');
      const asset1 = assetRepo.create({
        productId: product.id,
        assetCode: `${product.title.substring(0, 3).toUpperCase()}-001`,
        conditionGrade: AssetConditionGrade.A,
        status: AssetStatus.AVAILABLE,
        notes: '테스트용 자산 1',
      });
      const asset2 = assetRepo.create({
        productId: product.id,
        assetCode: `${product.title.substring(0, 3).toUpperCase()}-002`,
        conditionGrade: AssetConditionGrade.A,
        status: AssetStatus.AVAILABLE,
        notes: '테스트용 자산 2',
      });
      await assetRepo.save([asset1, asset2]);
      assets = [asset1, asset2];
      console.log('✅ 자산 2개 생성 완료\n');
    }

    // 3. 테스트 사용자 가져오기 (첫 번째 사용자)
    const users = await userRepo.find({ take: 1 });
    if (users.length === 0) {
      console.log('❌ 사용자가 없습니다.');
      return;
    }
    const user = users[0];

    // 4. 대여 기간 설정 (오늘부터 3일간)
    const today = new Date();
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 2); // 3일간 (시작일 포함)
    endDate.setHours(0, 0, 0, 0);

    // 5. 테스트 주문 생성
    console.log('📝 테스트 주문 생성 중...');
    const order = orderRepo.create({
      userId: user.id,
      startDate: startDate,
      endDate: endDate,
      totalAmount: product.baseDailyPrice * 3, // 3일 대여
      paymentStatus: PaymentStatus.PENDING,
      fulfillmentStatus: FulfillmentStatus.REQUESTED,
    });
    await orderRepo.save(order);
    console.log(`✅ 주문 생성 완료 (ID: ${order.id})\n`);

    const blockedEnd = new Date(endDate);
    blockedEnd.setDate(blockedEnd.getDate() + 1); // 버퍼 1일 추가
    blockedEnd.setHours(0, 0, 0, 0);

    console.log(`📅 대여 기간:`);
    console.log(`   시작일: ${startDate.toISOString().split('T')[0]}`);
    console.log(`   종료일: ${endDate.toISOString().split('T')[0]}`);
    console.log(`   차단 종료일 (버퍼 포함): ${blockedEnd.toISOString().split('T')[0]}\n`);

    // 6. 첫 번째 자산에 대한 대여 생성
    console.log(`🔒 자산 "${assets[0].assetCode}"에 대한 대여 생성 중...`);
    const rental = rentalRepo.create({
      orderId: order.id,
      assetId: assets[0].id,
      startDate: startDate,
      endDate: endDate,
      bufferDays: 1,
      blockedStart: startDate,
      blockedEnd: blockedEnd,
      status: RentalStatus.CONFIRMED,
    });
    await rentalRepo.save(rental);
    console.log(`✅ 대여 생성 완료 (ID: ${rental.id})\n`);

    // 7. 차단 기간 조회 테스트
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
        'rental.blockedStart',
        'rental.blockedEnd',
        'rental.status',
        'asset.assetCode',
      ])
      .orderBy('rental.blockedStart', 'ASC')
      .getRawMany();

    console.log('\n📋 차단 기간 조회 결과:');
    console.log(JSON.stringify(blockedPeriods, null, 2));

    // 8. 대여 가능한 자산 수 계산
    const allAssets = await assetRepo.find({
      where: {
        productId: product.id,
        status: AssetStatus.AVAILABLE,
      },
    });

    const blockedAssets = await rentalRepo
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
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      )
      .getRawMany();

    const availableCount = allAssets.filter(
      (a) => !blockedAssets.map((b) => b.rental_assetId).includes(a.id),
    ).length;

    console.log(`\n📊 대여 가능 자산 수 (${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}):`);
    console.log(`   전체 자산: ${allAssets.length}`);
    console.log(`   차단된 자산: ${blockedAssets.length}`);
    console.log(`   대여 가능: ${availableCount}`);

    console.log('\n✅ 일정 시스템 테스트 완료!');
    console.log(`\n🌐 API 테스트: curl "http://localhost:3001/api/products/${product.id}/blocked-periods"`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  } finally {
    await dataSource.destroy();
  }
}

testScheduleSystem();
