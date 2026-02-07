/**
 * 전체 시스템 테스트 시나리오
 * 사용자 관점과 관리자 관점에서 모든 기능을 테스트합니다
 */

const API_BASE = 'http://localhost:3001/api';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
  error?: any;
}

const results: TestResult[] = [];

// 유틸리티 함수
async function testAPI(
  name: string,
  method: string,
  endpoint: string,
  body?: any,
  token?: string
): Promise<TestResult> {
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
      return {
        name,
        success: false,
        message: `HTTP ${response.status}: ${data.message || JSON.stringify(data)}`,
        error: data,
      };
    }

    return {
      name,
      success: true,
      message: 'Success',
      data,
    };
  } catch (error: any) {
    return {
      name,
      success: false,
      message: error.message,
      error,
    };
  }
}

// 테스트 시나리오
async function runAllTests() {
  console.log('━'.repeat(80));
  console.log('🧪 전체 시스템 테스트 시작');
  console.log('━'.repeat(80));

  // 저장할 데이터
  let userToken = '';
  let userId = 0;
  let productId = 0;
  let cartId = 0;

  // ==================== 1. 회원가입 ====================
  console.log('\n📝 [1/10] 회원가입 테스트...');
  const signupResult = await testAPI(
    '회원가입',
    'POST',
    '/auth/register',
    {
      email: `testuser${Date.now()}@example.com`,
      password: 'password123',
      name: '테스트 사용자',
    }
  );
  results.push(signupResult);

  if (signupResult.success) {
    console.log(`✅ ${signupResult.name}: ${signupResult.message}`);
    userId = signupResult.data.user.id;
  } else {
    console.error(`❌ ${signupResult.name}: ${signupResult.message}`);
  }

  // ==================== 2. 로그인 ====================
  console.log('\n🔐 [2/10] 로그인 테스트...');
  const loginResult = await testAPI(
    '로그인',
    'POST',
    '/auth/login',
    {
      email: signupResult.data?.user?.email || 'test@example.com',
      password: 'password123',
    }
  );
  results.push(loginResult);

  if (loginResult.success) {
    console.log(`✅ ${loginResult.name}: ${loginResult.message}`);
    userToken = loginResult.data?.access_token || '';
    if (userToken) {
      console.log(`   🔑 토큰: ${userToken.substring(0, 20)}...`);
    }
  } else {
    console.error(`❌ ${loginResult.name}: ${loginResult.message}`);
  }

  // ==================== 3. 카테고리 조회 ====================
  console.log('\n📂 [3/10] 카테고리 조회 테스트...');
  const categoriesResult = await testAPI(
    '카테고리 목록 조회',
    'GET',
    '/categories'
  );
  results.push(categoriesResult);

  if (categoriesResult.success) {
    console.log(`✅ ${categoriesResult.name}: ${categoriesResult.data.length}개 카테고리 발견`);
    categoriesResult.data.forEach((cat: any) => {
      console.log(`   - ${cat.name} (ID: ${cat.id})`);
    });
  } else {
    console.error(`❌ ${categoriesResult.name}: ${categoriesResult.message}`);
  }

  // ==================== 4. 상품 조회 ====================
  console.log('\n🎭 [4/10] 상품 목록 조회 테스트...');
  const productsResult = await testAPI(
    '상품 목록 조회',
    'GET',
    '/products'
  );
  results.push(productsResult);

  if (productsResult.success) {
    console.log(`✅ ${productsResult.name}: ${productsResult.data.length}개 상품 발견`);
    if (productsResult.data.length > 0) {
      productId = productsResult.data[0].id;
      console.log(`   첫 번째 상품: ${productsResult.data[0].title || productsResult.data[0].name} (ID: ${productId})`);
      console.log(`   가격: ${productsResult.data[0].baseDailyPrice || productsResult.data[0].pricePerDay}원/일`);
      console.log(`   에셋: ${productsResult.data[0].assets?.length || 0}개`);
    }
  } else {
    console.error(`❌ ${productsResult.name}: ${productsResult.message}`);
  }

  // ==================== 5. 상품 검색 ====================
  console.log('\n🔍 [5/10] 상품 검색 테스트...');
  const searchResult = await testAPI(
    '상품 검색',
    'GET',
    '/products/search?keyword=프랑스'
  );
  results.push(searchResult);

  if (searchResult.success) {
    console.log(`✅ ${searchResult.name}: ${searchResult.data.length}개 검색 결과`);
  } else {
    console.error(`❌ ${searchResult.name}: ${searchResult.message}`);
  }

  // ==================== 6. 상품 상세 조회 ====================
  if (productId) {
    console.log('\n📄 [6/10] 상품 상세 조회 테스트...');
    const productDetailResult = await testAPI(
      '상품 상세 조회',
      'GET',
      `/products/${productId}`
    );
    results.push(productDetailResult);

    if (productDetailResult.success) {
      console.log(`✅ ${productDetailResult.name}: ${productDetailResult.data.title || productDetailResult.data.name}`);
      const desc = productDetailResult.data.description;
      console.log(`   설명: ${desc ? desc.substring(0, Math.min(50, desc.length)) : '없음'}...`);
      console.log(`   카테고리: ${productDetailResult.data.category?.name || '없음'}`);
      const tags = productDetailResult.data.tags?.map((t: any) => `#${t.name}`).join(' ') || '없음';
      console.log(`   태그: ${tags}`);
    } else {
      console.error(`❌ ${productDetailResult.name}: ${productDetailResult.message}`);
    }
  }

  // ==================== 7. 장바구니에 추가 ====================
  if (productId && userToken) {
    console.log('\n🛒 [7/10] 장바구니 추가 테스트...');
    const addToCartResult = await testAPI(
      '장바구니에 상품 추가',
      'POST',
      '/cart/items',
      {
        productId,
        quantity: 2,
        rentalStartDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        rentalEndDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      },
      userToken
    );
    results.push(addToCartResult);

    if (addToCartResult.success) {
      console.log(`✅ ${addToCartResult.name}: 상품이 장바구니에 추가됨`);
    } else {
      console.error(`❌ ${addToCartResult.name}: ${addToCartResult.message}`);
    }
  }

  // ==================== 8. 장바구니 조회 ====================
  if (userToken) {
    console.log('\n📦 [8/10] 장바구니 조회 테스트...');
    const cartResult = await testAPI(
      '장바구니 조회',
      'GET',
      '/cart',
      undefined,
      userToken
    );
    results.push(cartResult);

    if (cartResult.success) {
      console.log(`✅ ${cartResult.name}: ${cartResult.data.items?.length || 0}개 항목`);
      console.log(`   총 금액: ${cartResult.data.totalAmount || 0}원`);
      if (cartResult.data.items?.length > 0) {
        cartId = cartResult.data.items[0].id;
      }
    } else {
      console.error(`❌ ${cartResult.name}: ${cartResult.message}`);
    }
  }

  // ==================== 9. 장바구니 수량 변경 ====================
  if (userToken && cartId) {
    console.log('\n✏️ [9/10] 장바구니 수량 변경 테스트...');
    const updateQuantityResult = await testAPI(
      '장바구니 수량 변경',
      'POST',
      `/cart/items/${cartId}/quantity`,
      { quantity: 3 },
      userToken
    );
    results.push(updateQuantityResult);

    if (updateQuantityResult.success) {
      console.log(`✅ ${updateQuantityResult.name}: 수량이 3개로 변경됨`);
    } else {
      console.error(`❌ ${updateQuantityResult.name}: ${updateQuantityResult.message}`);
    }
  }

  // ==================== 10. 장바구니 항목 삭제 ====================
  if (userToken && cartId) {
    console.log('\n🗑️ [10/10] 장바구니 항목 삭제 테스트...');
    const removeItemResult = await testAPI(
      '장바구니 항목 삭제',
      'DELETE',
      `/cart/items/${cartId}`,
      undefined,
      userToken
    );
    results.push(removeItemResult);

    if (removeItemResult.success) {
      console.log(`✅ ${removeItemResult.name}: 항목이 삭제됨`);
    } else {
      console.error(`❌ ${removeItemResult.name}: ${removeItemResult.message}`);
    }
  }

  // ==================== 결과 요약 ====================
  console.log('\n' + '━'.repeat(80));
  console.log('📊 테스트 결과 요약');
  console.log('━'.repeat(80));

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  console.log(`\n총 테스트: ${results.length}개`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  console.log(`📈 성공률: ${((successCount / results.length) * 100).toFixed(1)}%`);

  if (failCount > 0) {
    console.log('\n실패한 테스트:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.message}`);
    });
  }

  console.log('\n' + '━'.repeat(80));

  return results;
}

// 실행
runAllTests()
  .then((results) => {
    const failCount = results.filter(r => !r.success).length;
    process.exit(failCount > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
