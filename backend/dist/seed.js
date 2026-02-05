"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const entities_1 = require("./entities");
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    console.log('🌱 시드 데이터 생성 시작...');
    const userRepo = dataSource.getRepository(entities_1.User);
    const passwordHash = await bcrypt.hash('password123', 10);
    const admin = await userRepo.save({
        email: 'admin@example.com',
        passwordHash,
        name: '관리자',
        role: entities_1.UserRole.ADMIN,
        status: entities_1.UserStatus.ACTIVE,
    });
    const supplier1 = await userRepo.save({
        email: 'supplier1@example.com',
        passwordHash,
        name: '연극의상 전문점',
        role: entities_1.UserRole.SUPPLIER,
        status: entities_1.UserStatus.ACTIVE,
    });
    const supplier2 = await userRepo.save({
        email: 'supplier2@example.com',
        passwordHash,
        name: '클래식 스타일',
        role: entities_1.UserRole.SUPPLIER,
        status: entities_1.UserStatus.ACTIVE,
    });
    const customer = await userRepo.save({
        email: 'customer@example.com',
        passwordHash,
        name: '김고객',
        role: entities_1.UserRole.CUSTOMER,
        status: entities_1.UserStatus.ACTIVE,
    });
    console.log('✅ 사용자 생성 완료');
    const categoryRepo = dataSource.getRepository(entities_1.Category);
    const costume = await categoryRepo.save({
        name: '의상',
        slug: 'costume',
        level: 1,
    });
    const props = await categoryRepo.save({
        name: '소품',
        slug: 'props',
        level: 1,
    });
    const stage = await categoryRepo.save({
        name: '무대장치',
        slug: 'stage',
        level: 1,
    });
    const equipment = await categoryRepo.save({
        name: '장비',
        slug: 'equipment',
        level: 1,
    });
    console.log('✅ 카테고리 생성 완료');
    const tagRepo = dataSource.getRepository(entities_1.Tag);
    const tags = await tagRepo.save([
        { name: '프랑스', status: entities_1.TagStatus.APPROVED },
        { name: '혁명', status: entities_1.TagStatus.APPROVED },
        { name: '18세기', status: entities_1.TagStatus.APPROVED },
        { name: '군복', status: entities_1.TagStatus.APPROVED },
        { name: '영국', status: entities_1.TagStatus.APPROVED },
        { name: '빅토리아', status: entities_1.TagStatus.APPROVED },
        { name: '19세기', status: entities_1.TagStatus.APPROVED },
        { name: '드레스', status: entities_1.TagStatus.APPROVED },
        { name: '한국', status: entities_1.TagStatus.APPROVED },
        { name: '조선', status: entities_1.TagStatus.APPROVED },
        { name: '궁중', status: entities_1.TagStatus.APPROVED },
        { name: '한복', status: entities_1.TagStatus.APPROVED },
        { name: '미국', status: entities_1.TagStatus.APPROVED },
        { name: '1920년대', status: entities_1.TagStatus.APPROVED },
        { name: '재즈', status: entities_1.TagStatus.APPROVED },
        { name: '플래퍼', status: entities_1.TagStatus.APPROVED },
    ]);
    console.log('✅ 태그 생성 완료');
    const productRepo = dataSource.getRepository(entities_1.Product);
    const product1 = await productRepo.save({
        supplierId: supplier1.id,
        title: '프랑스 혁명 시대 군복',
        description: '18세기 프랑스 혁명 시대의 정통 군복입니다. 연극과 영화 촬영에 완벽합니다.',
        baseDailyPrice: 45000,
        categoryId: costume.id,
        status: entities_1.ProductStatus.ACTIVE,
    });
    const product2 = await productRepo.save({
        supplierId: supplier2.id,
        title: '빅토리아 시대 귀족 드레스',
        description: '19세기 영국 빅토리아 시대의 화려한 귀족 드레스입니다.',
        baseDailyPrice: 52000,
        categoryId: costume.id,
        status: entities_1.ProductStatus.ACTIVE,
    });
    const product3 = await productRepo.save({
        supplierId: supplier1.id,
        title: '조선시대 궁중 한복',
        description: '조선시대 왕실에서 입던 화려한 궁중 한복 세트입니다.',
        baseDailyPrice: 38000,
        categoryId: costume.id,
        status: entities_1.ProductStatus.ACTIVE,
    });
    const product4 = await productRepo.save({
        supplierId: supplier2.id,
        title: '1920년대 플래퍼 드레스',
        description: '미국 재즈 시대의 상징적인 플래퍼 스타일 드레스입니다.',
        baseDailyPrice: 42000,
        categoryId: costume.id,
        status: entities_1.ProductStatus.ACTIVE,
    });
    console.log('✅ 상품 생성 완료');
    await dataSource
        .createQueryBuilder()
        .relation(entities_1.Product, 'tags')
        .of(product1)
        .add([tags[0], tags[1], tags[2], tags[3]]);
    await dataSource
        .createQueryBuilder()
        .relation(entities_1.Product, 'tags')
        .of(product2)
        .add([tags[4], tags[5], tags[6], tags[7]]);
    await dataSource
        .createQueryBuilder()
        .relation(entities_1.Product, 'tags')
        .of(product3)
        .add([tags[8], tags[9], tags[10], tags[11]]);
    await dataSource
        .createQueryBuilder()
        .relation(entities_1.Product, 'tags')
        .of(product4)
        .add([tags[12], tags[13], tags[14], tags[15]]);
    console.log('✅ 상품-태그 연결 완료');
    const assetRepo = dataSource.getRepository(entities_1.Asset);
    for (let i = 1; i <= 8; i++) {
        await assetRepo.save({
            productId: product1.id,
            assetCode: `FR-${i.toString().padStart(3, '0')}`,
            conditionGrade: entities_1.AssetConditionGrade.A,
            status: entities_1.AssetStatus.AVAILABLE,
        });
    }
    for (let i = 1; i <= 5; i++) {
        await assetRepo.save({
            productId: product2.id,
            assetCode: `VIC-${i.toString().padStart(3, '0')}`,
            conditionGrade: entities_1.AssetConditionGrade.A,
            status: entities_1.AssetStatus.AVAILABLE,
        });
    }
    for (let i = 1; i <= 12; i++) {
        await assetRepo.save({
            productId: product3.id,
            assetCode: `KR-${i.toString().padStart(3, '0')}`,
            conditionGrade: i > 8 ? entities_1.AssetConditionGrade.B : entities_1.AssetConditionGrade.A,
            status: entities_1.AssetStatus.AVAILABLE,
        });
    }
    for (let i = 1; i <= 3; i++) {
        await assetRepo.save({
            productId: product4.id,
            assetCode: `US-${i.toString().padStart(3, '0')}`,
            conditionGrade: entities_1.AssetConditionGrade.A,
            status: entities_1.AssetStatus.RENTED,
        });
    }
    console.log('✅ 자산 생성 완료');
    console.log('🎉 시드 데이터 생성 완료!');
    console.log('\n로그인 정보:');
    console.log('관리자: admin@example.com / password123');
    console.log('공급자1: supplier1@example.com / password123');
    console.log('공급자2: supplier2@example.com / password123');
    console.log('고객: customer@example.com / password123');
    await app.close();
}
seed().catch((error) => {
    console.error('❌ 시드 데이터 생성 실패:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map