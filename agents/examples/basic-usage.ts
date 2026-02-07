import { initializeMetaAgent, runAgent, SubAgentType, TriggerEvent } from '../src/index.js';

/**
 * 기본 사용 예제
 */
async function basicExample() {
  console.log('='.repeat(70));
  console.log('예제 1: 코드 리뷰');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent();

  // 예제 코드
  const sampleCode = `
export class UserService {
  private users = [];

  async createUser(data) {
    const user = { id: Date.now(), ...data };
    this.users.push(user);
    return user;
  }

  async getUser(id) {
    return this.users.find(u => u.id == id);
  }

  async deleteUser(id) {
    this.users = this.users.filter(u => u.id !== id);
  }
}
  `;

  // 코드 리뷰 실행
  const result = await runAgent(metaAgent, SubAgentType.CODE_REVIEWER, {
    filePath: 'user.service.ts',
    code: sampleCode,
  });

  console.log('\n📊 리뷰 결과:');
  console.log('━'.repeat(70));
  if (result) {
    console.log(result.output);
  }
}

/**
 * 이벤트 기반 자동 실행 예제
 */
async function eventExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 2: 이벤트 기반 자동 실행');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent();

  const newCode = `
export async function calculateTotal(items: CartItem[]): Promise<number> {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}
  `;

  // CODE_WRITTEN 이벤트 발생
  const results = await metaAgent.handleEvent({
    event: TriggerEvent.CODE_WRITTEN,
    filePath: 'cart.service.ts',
    code: newCode,
  });

  if (results) {
    console.log(`\n✅ ${results.length}개의 에이전트가 자동으로 실행됨`);
  }
}

/**
 * 여러 에이전트 순차 실행 예제
 */
async function multiAgentExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 3: 여러 에이전트 순차 실행');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent();

  const apiCode = `
@Controller('products')
export class ProductController {
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  async createProduct(@Body() data: CreateProductDto) {
    return this.productService.create(data);
  }
}
  `;

  // 1. 코드 리뷰
  console.log('\n1️⃣  코드 리뷰 실행...');
  await runAgent(metaAgent, SubAgentType.CODE_REVIEWER, {
    code: apiCode,
  });

  // 2. 테스트 생성
  console.log('\n2️⃣  테스트 코드 생성...');
  await runAgent(metaAgent, SubAgentType.TEST_GENERATOR, {
    code: apiCode,
  });

  // 3. 문서 생성
  console.log('\n3️⃣  API 문서 생성...');
  await runAgent(metaAgent, SubAgentType.DOCUMENTOR, {
    code: apiCode,
  });

  // 히스토리 확인
  const history = metaAgent.getHistory();
  console.log(`\n📜 총 ${history.length}개의 작업이 실행됨`);
}

/**
 * 에러 디버깅 예제
 */
async function debugExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 4: 에러 디버깅');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent();

  const errorCode = `
function processOrder(order) {
  const total = order.items.reduce((sum, item) => sum + item.price, 0);
  if (total > order.user.balance) {
    throw new Error('Insufficient funds');
  }
  return total;
}
  `;

  const error = new Error('Cannot read property "balance" of undefined');
  error.stack = `TypeError: Cannot read property 'balance' of undefined
    at processOrder (order.service.ts:4:35)
    at OrderController.createOrder (order.controller.ts:12:20)`;

  // 디버거 실행
  await metaAgent.handleEvent({
    event: TriggerEvent.ERROR_DETECTED,
    filePath: 'order.service.ts',
    code: errorCode,
    error,
  });
}

/**
 * 모든 예제 실행
 */
async function runAllExamples() {
  try {
    await basicExample();
    await eventExample();
    await multiAgentExample();
    await debugExample();

    console.log('\n' + '='.repeat(70));
    console.log('✅ 모든 예제 실행 완료!');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

// 실행
runAllExamples();
