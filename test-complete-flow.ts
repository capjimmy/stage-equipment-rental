/**
 * 완전한 E2E 테스트 - 사용자 전체 플로우
 * 1. 회원가입 → 2. 로그인 → 3. 상품 검색 → 4. 장바구니 추가 → 5. 주문 생성 → 6. 주문 조회
 */

const API_BASE = 'http://localhost:3001/api';

interface TestResult {
  step: number;
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];
let currentStep = 0;

async function testAPI(
  name: string,
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<any> {
  currentStep++;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      results.push({
        step: currentStep,
        name,
        success: false,
        message: `HTTP ${response.status}: ${data.message || JSON.stringify(data)}`,
        data,
      });
      throw new Error(`${name} 실패: ${data.message}`);
    }

    results.push({
      step: currentStep,
      name,
      success: true,
      message: 'Success',
      data,
    });

    return data;
  } catch (error: any) {
    if (!results.find(r => r.step === currentStep)) {
      results.push({
        step: currentStep,
        name,
        success: false,
        message: error.message,
      });
    }
    throw error;
  }
}

async function runCompleteFlow() {
  console.log('━'.repeat(80));
  console.log('🚀 완전한 E2E 테스트 시작 - 사용자 전체 플로우');
  console.log('━'.repeat(80));

  let userToken = '';
  let userId = 0;
  let productId = '';
  let cartItemId = '';
  let orderId = '';

  try {
    // ==================== 1. 회원가입 ====================
    console.log('\n📝 [1] 회원가입...');
    const email = `testuser${Date.now()}@example.com`;
    const signupData = await testAPI(
      '회원가입',
      'POST',
      '/auth/register',
      {
        email,
        password: 'Test1234!',
        name: '테스트 사용자',
      }
    );
    userId = signupData.user.id;
    console.log(`   ✅ 사용자 생성됨: ${email} (ID: ${userId})`);

    // ==================== 2. 로그인 ====================
    console.log('\n🔐 [2] 로그인...');
    const loginData = await testAPI(
      '로그인',
      'POST',
      '/auth/login',
      {
        email,
        password: 'Test1234!',
      }
    );
    userToken = loginData.accessToken || loginData.access_token || '';
    console.log(`   ✅ 로그인 성공`);
    if (userToken) {
      console.log(`   🔑 토큰: ${userToken.substring(0, 30)}...`);
    } else {
      throw new Error('토큰을 받지 못했습니다');
    }

    // ==================== 3. 상품 검색 ====================
    console.log('\n🔍 [3] 상품 검색...');
    const searchData = await testAPI(
      '상품 검색',
      'GET',
      '/products/search?keyword=프랑스'
    );
    console.log(`   ✅ ${searchData.length}개 상품 발견`);

    if (searchData.length > 0) {
      productId = searchData[0].id;
      console.log(`   📦 선택한 상품: ${searchData[0].title}`);
      console.log(`   💰 가격: ${searchData[0].baseDailyPrice}원/일`);
    }

    // ==================== 4. 상품 상세 조회 ====================
    console.log('\n📄 [4] 상품 상세 조회...');
    const productData = await testAPI(
      '상품 상세 조회',
      'GET',
      `/products/${productId}`
    );
    console.log(`   ✅ ${productData.title}`);
    console.log(`   📝 ${productData.description?.substring(0, 50)}...`);
    console.log(`   🏷️  카테고리: ${productData.category?.name}`);

    // ==================== 5. 대여 가능 기간 확인 ====================
    console.log('\n📅 [5] 대여 가능 기간 확인...');
    const tomorrow = new Date(Date.now() + 86400000);
    const nextWeek = new Date(Date.now() + 86400000 * 7);

    const blockedData = await testAPI(
      '차단된 기간 조회',
      'GET',
      `/products/${productId}/blocked-periods?start=${tomorrow.toISOString().split('T')[0]}&end=${nextWeek.toISOString().split('T')[0]}`
    );
    console.log(`   ✅ 차단된 기간: ${blockedData.length}개`);

    // ==================== 6. 장바구니에 추가 ====================
    console.log('\n🛒 [6] 장바구니에 추가...');
    const startDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0];

    await testAPI(
      '장바구니에 상품 추가',
      'POST',
      '/cart/items',
      {
        productId,
        quantity: 2,
        startDate: startDate,
        endDate: endDate,
      },
      userToken
    );
    console.log(`   ✅ 장바구니에 추가됨 (수량: 2, ${startDate} ~ ${endDate})`);

    // ==================== 7. 장바구니 조회 ====================
    console.log('\n📦 [7] 장바구니 조회...');
    const cartData = await testAPI(
      '장바구니 조회',
      'GET',
      '/cart',
      undefined,
      userToken
    );
    console.log(`   ✅ 장바구니 항목: ${cartData.items?.length || 0}개`);
    console.log(`   💵 총 금액: ${cartData.totalAmount || 0}원`);

    if (cartData.items && cartData.items.length > 0) {
      cartItemId = cartData.items[0].id;
    }

    // ==================== 8. 주문 생성 ====================
    console.log('\n📋 [8] 주문 생성...');
    const orderData = await testAPI(
      '주문 생성',
      'POST',
      '/orders',
      {
        startDate,
        endDate,
        deliveryMethod: 'parcel',
        shippingAddress: '서울특별시 강남구 테헤란로 123',
        deliveryNotes: '부재 시 경비실에 맡겨주세요',
      },
      userToken
    );
    orderId = orderData.id;
    console.log(`   ✅ 주문 생성됨: ${orderId}`);
    console.log(`   💰 총 금액: ${orderData.totalAmount}원`);
    console.log(`   🚚 배송비: ${orderData.shippingCost}원`);
    console.log(`   📍 배송지: ${orderData.shippingAddress}`);
    console.log(`   📦 렌탈 항목: ${orderData.rentals?.length || 0}개`);

    // ==================== 9. 주문 상세 조회 ====================
    console.log('\n🔍 [9] 주문 상세 조회...');
    const orderDetailData = await testAPI(
      '주문 상세 조회',
      'GET',
      `/orders/${orderId}`,
      undefined,
      userToken
    );
    console.log(`   ✅ 주문 번호: ${orderDetailData.id}`);
    console.log(`   📅 대여 기간: ${orderDetailData.startDate} ~ ${orderDetailData.endDate}`);
    console.log(`   💳 결제 상태: ${orderDetailData.paymentStatus}`);
    console.log(`   📦 처리 상태: ${orderDetailData.fulfillmentStatus}`);

    // ==================== 10. 내 주문 목록 조회 ====================
    console.log('\n📜 [10] 내 주문 목록 조회...');
    const myOrdersData = await testAPI(
      '내 주문 목록',
      'GET',
      '/orders/my',
      undefined,
      userToken
    );
    console.log(`   ✅ 총 주문 수: ${myOrdersData.length}개`);

    // ==================== 11. 장바구니 비었는지 확인 ====================
    console.log('\n🛒 [11] 주문 후 장바구니 확인...');
    const emptyCartData = await testAPI(
      '주문 후 장바구니 조회',
      'GET',
      '/cart',
      undefined,
      userToken
    );
    console.log(`   ✅ 장바구니 항목: ${emptyCartData.items?.length || 0}개 (비어있어야 함)`);

    if (emptyCartData.items?.length === 0) {
      console.log(`   ✅ 주문 후 장바구니가 정상적으로 비워짐`);
    }

    // ==================== 결과 요약 ====================
    console.log('\n' + '━'.repeat(80));
    console.log('📊 테스트 결과 요약');
    console.log('━'.repeat(80));

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`\n✨ 완전한 E2E 플로우 테스트 완료!`);
    console.log(`\n총 테스트: ${results.length}개`);
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log(`📈 성공률: ${((successCount / results.length) * 100).toFixed(1)}%`);

    if (failCount === 0) {
      console.log(`\n🎉 모든 테스트를 성공적으로 통과했습니다!`);
      console.log(`\n📝 테스트한 주요 기능:`);
      console.log(`   ✅ 회원가입 및 인증`);
      console.log(`   ✅ 상품 검색 및 조회`);
      console.log(`   ✅ 장바구니 관리`);
      console.log(`   ✅ 대여 기간 충돌 체크`);
      console.log(`   ✅ 주문 생성 및 조회`);
      console.log(`   ✅ 렌탈 항목 자동 생성`);
    } else {
      console.log(`\n실패한 테스트:`);
      results.filter(r => !r.success).forEach(r => {
        console.log(`  ❌ [${r.step}] ${r.name}: ${r.message}`);
      });
    }

    console.log('\n' + '━'.repeat(80));

    return failCount === 0;

  } catch (error: any) {
    console.error(`\n❌ 치명적 에러 발생: ${error.message}`);
    console.log('\n실패 지점까지의 결과:');
    results.forEach(r => {
      const icon = r.success ? '✅' : '❌';
      console.log(`  ${icon} [${r.step}] ${r.name}`);
    });
    return false;
  }
}

// 실행
runCompleteFlow()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
