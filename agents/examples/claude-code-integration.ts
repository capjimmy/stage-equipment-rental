/**
 * Claude Code 통합 예제
 *
 * 이 예제는 현재 Claude Code 대화 컨텍스트 내에서
 * 서브에이전트를 실행하는 방법을 보여줍니다.
 */

import {
  initializeMetaAgent,
  ClaudeCodeMetaAgent,
  SubAgentType,
  TriggerEvent,
} from '../src/index.js';

/**
 * 예제 1: 코드 작성 후 자동 리뷰
 */
async function autoReviewExample() {
  console.log('='.repeat(70));
  console.log('예제 1: 코드 작성 후 자동 리뷰');
  console.log('='.repeat(70));

  // Claude Code 통합 모드로 초기화
  const metaAgent = await initializeMetaAgent('claude-code') as ClaudeCodeMetaAgent;

  // 새로 작성한 코드
  const newCode = `
export class PaymentService {
  async processPayment(orderId: string, amount: number) {
    const order = await this.orderRepository.findById(orderId);
    const user = order.user;

    if (user.balance < amount) {
      throw new Error('Insufficient funds');
    }

    user.balance -= amount;
    await this.userRepository.save(user);

    return { success: true };
  }
}
  `;

  // 코드 작성 이벤트 발생 -> 자동으로 리뷰, 테스트, 문서 생성
  await metaAgent.handleEvent({
    event: TriggerEvent.CODE_WRITTEN,
    filePath: 'payment.service.ts',
    code: newCode,
  });

  console.log('\n💡 이제 Claude Code에게 다음과 같이 요청하세요:');
  console.log('   "위에서 제안한 에이전트들을 실행해줘"');
}

/**
 * 예제 2: 에러 발생 시 자동 디버깅
 */
async function autoDebugExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 2: 에러 발생 시 자동 디버깅');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent('claude-code') as ClaudeCodeMetaAgent;

  const problematicCode = `
export async function getUserOrders(userId: string) {
  const user = await userRepository.findById(userId);
  const orders = user.orders.filter(o => o.status === 'completed');
  return orders;
}
  `;

  const error = new Error('Cannot read property "filter" of undefined');
  error.stack = `TypeError: Cannot read property 'filter' of undefined
    at getUserOrders (user.service.ts:3:28)
    at UserController.getOrders (user.controller.ts:15:20)`;

  // 에러 이벤트 발생 -> 자동으로 디버거 실행
  await metaAgent.handleEvent({
    event: TriggerEvent.ERROR_DETECTED,
    filePath: 'user.service.ts',
    code: problematicCode,
    error,
  });
}

/**
 * 예제 3: API 엔드포인트 생성 후 자동 문서화 및 테스트
 */
async function apiDocumentationExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 3: API 생성 후 자동 문서화 및 테스트');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent('claude-code') as ClaudeCodeMetaAgent;

  const apiCode = `
@Controller('rentals')
export class RentalController {
  @Post()
  async createRental(@Body() createRentalDto: CreateRentalDto) {
    return this.rentalService.create(createRentalDto);
  }

  @Get(':id')
  async getRental(@Param('id') id: string) {
    return this.rentalService.findOne(id);
  }

  @Patch(':id/return')
  async returnEquipment(@Param('id') id: string) {
    return this.rentalService.returnEquipment(id);
  }
}
  `;

  // API 생성 이벤트
  await metaAgent.handleEvent({
    event: TriggerEvent.API_CREATED,
    filePath: 'rental.controller.ts',
    code: apiCode,
  });
}

/**
 * 예제 4: 프로그래밍 방식으로 Task 요청 생성
 */
async function programmaticExample() {
  console.log('\n' + '='.repeat(70));
  console.log('예제 4: 프로그래밍 방식으로 Task 요청');
  console.log('='.repeat(70));

  const metaAgent = await initializeMetaAgent('claude-code') as ClaudeCodeMetaAgent;

  const code = `
export function calculateRentalPrice(
  basePrice: number,
  days: number,
  discount: number = 0
): number {
  return basePrice * days * (1 - discount);
}
  `;

  // 특정 에이전트만 실행
  console.log('\n1️⃣  코드 리뷰만 요청:');
  await metaAgent.executeAgent(SubAgentType.CODE_REVIEWER, {
    event: TriggerEvent.MANUAL,
    code,
  });

  console.log('\n2️⃣  테스트 생성만 요청:');
  await metaAgent.executeAgent(SubAgentType.TEST_GENERATOR, {
    event: TriggerEvent.MANUAL,
    code,
  });
}

/**
 * 모든 예제 실행
 */
async function main() {
  try {
    await autoReviewExample();
    await autoDebugExample();
    await apiDocumentationExample();
    await programmaticExample();

    console.log('\n' + '='.repeat(70));
    console.log('✅ 모든 예제 완료!');
    console.log('\n📚 다음 단계:');
    console.log('   1. 위에서 제안된 에이전트 작업들을 Claude Code에 요청하세요');
    console.log('   2. 파일 감시 모드를 사용하여 자동화할 수 있습니다');
    console.log('   3. npm run dev watch 명령으로 시작하세요');
    console.log('='.repeat(70));
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

// 실행
main();
