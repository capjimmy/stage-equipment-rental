"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const asset_entity_1 = require("./entities/asset.entity");
const order_entity_1 = require("./entities/order.entity");
const rental_entity_1 = require("./entities/rental.entity");
const user_entity_1 = require("./entities/user.entity");
const dataSource = new typeorm_1.DataSource({
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
        const productRepo = dataSource.getRepository(product_entity_1.Product);
        const assetRepo = dataSource.getRepository(asset_entity_1.Asset);
        const orderRepo = dataSource.getRepository(order_entity_1.Order);
        const rentalRepo = dataSource.getRepository(rental_entity_1.Rental);
        const userRepo = dataSource.getRepository(user_entity_1.User);
        const products = await productRepo.find({ take: 1 });
        if (products.length === 0) {
            console.log('❌ 상품이 없습니다. 먼저 상품을 등록해주세요.');
            return;
        }
        const product = products[0];
        console.log(`📦 테스트 상품: ${product.title} (ID: ${product.id})\n`);
        let assets = await assetRepo.find({
            where: { productId: product.id },
        });
        console.log(`📊 현재 자산 수: ${assets.length}`);
        if (assets.length === 0) {
            console.log('🔨 자산 2개 생성 중...');
            const asset1 = assetRepo.create({
                productId: product.id,
                assetCode: `${product.title.substring(0, 3).toUpperCase()}-001`,
                conditionGrade: asset_entity_1.AssetConditionGrade.A,
                status: asset_entity_1.AssetStatus.AVAILABLE,
                notes: '테스트용 자산 1',
            });
            const asset2 = assetRepo.create({
                productId: product.id,
                assetCode: `${product.title.substring(0, 3).toUpperCase()}-002`,
                conditionGrade: asset_entity_1.AssetConditionGrade.A,
                status: asset_entity_1.AssetStatus.AVAILABLE,
                notes: '테스트용 자산 2',
            });
            await assetRepo.save([asset1, asset2]);
            assets = [asset1, asset2];
            console.log('✅ 자산 2개 생성 완료\n');
        }
        const users = await userRepo.find({ take: 1 });
        if (users.length === 0) {
            console.log('❌ 사용자가 없습니다.');
            return;
        }
        const user = users[0];
        const today = new Date();
        const startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 2);
        endDate.setHours(0, 0, 0, 0);
        console.log('📝 테스트 주문 생성 중...');
        const order = orderRepo.create({
            userId: user.id,
            startDate: startDate,
            endDate: endDate,
            totalAmount: product.baseDailyPrice * 3,
            paymentStatus: order_entity_1.PaymentStatus.PENDING,
            fulfillmentStatus: order_entity_1.FulfillmentStatus.REQUESTED,
        });
        await orderRepo.save(order);
        console.log(`✅ 주문 생성 완료 (ID: ${order.id})\n`);
        const blockedEnd = new Date(endDate);
        blockedEnd.setDate(blockedEnd.getDate() + 1);
        blockedEnd.setHours(0, 0, 0, 0);
        console.log(`📅 대여 기간:`);
        console.log(`   시작일: ${startDate.toISOString().split('T')[0]}`);
        console.log(`   종료일: ${endDate.toISOString().split('T')[0]}`);
        console.log(`   차단 종료일 (버퍼 포함): ${blockedEnd.toISOString().split('T')[0]}\n`);
        console.log(`🔒 자산 "${assets[0].assetCode}"에 대한 대여 생성 중...`);
        const rental = rentalRepo.create({
            orderId: order.id,
            assetId: assets[0].id,
            startDate: startDate,
            endDate: endDate,
            bufferDays: 1,
            blockedStart: startDate,
            blockedEnd: blockedEnd,
            status: rental_entity_1.RentalStatus.CONFIRMED,
        });
        await rentalRepo.save(rental);
        console.log(`✅ 대여 생성 완료 (ID: ${rental.id})\n`);
        console.log('🔍 차단 기간 조회 중...');
        const blockedPeriods = await rentalRepo
            .createQueryBuilder('rental')
            .leftJoin('rental.asset', 'asset')
            .where('asset.productId = :productId', { productId: product.id })
            .andWhere('rental.status IN (:...statuses)', {
            statuses: [
                rental_entity_1.RentalStatus.HOLD_PENDINGPAY,
                rental_entity_1.RentalStatus.CONFIRMED,
                rental_entity_1.RentalStatus.RENTED,
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
        const allAssets = await assetRepo.find({
            where: {
                productId: product.id,
                status: asset_entity_1.AssetStatus.AVAILABLE,
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
                rental_entity_1.RentalStatus.HOLD_PENDINGPAY,
                rental_entity_1.RentalStatus.CONFIRMED,
                rental_entity_1.RentalStatus.RENTED,
            ],
        })
            .andWhere('NOT (rental.blockedEnd < :startDate OR rental.blockedStart > :endDate)', {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
        })
            .getRawMany();
        const availableCount = allAssets.filter((a) => !blockedAssets.map((b) => b.rental_assetId).includes(a.id)).length;
        console.log(`\n📊 대여 가능 자산 수 (${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}):`);
        console.log(`   전체 자산: ${allAssets.length}`);
        console.log(`   차단된 자산: ${blockedAssets.length}`);
        console.log(`   대여 가능: ${availableCount}`);
        console.log('\n✅ 일정 시스템 테스트 완료!');
        console.log(`\n🌐 API 테스트: curl "http://localhost:3001/api/products/${product.id}/blocked-periods"`);
    }
    catch (error) {
        console.error('❌ 오류 발생:', error);
    }
    finally {
        await dataSource.destroy();
    }
}
testScheduleSystem();
//# sourceMappingURL=test-schedule.js.map