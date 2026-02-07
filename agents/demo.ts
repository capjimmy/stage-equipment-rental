#!/usr/bin/env tsx

/**
 * 🎯 메타 에이전트 시스템 데모
 *
 * 이 스크립트를 실행하면 Claude Code와 통합된 메타 에이전트가
 * 코드를 분석하고 필요한 서브에이전트를 자동으로 제안합니다.
 */

import {
  initializeMetaAgent,
  ClaudeCodeMetaAgent,
  TriggerEvent,
} from './src/index.js';

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        🤖 자동 서브에이전트 시스템 - 실시간 데모               ║
║                                                                ║
║  Claude Code의 현재 컨텍스트를 공유하여 코드를 자동 분석합니다  ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

async function demo() {
  // Claude Code 통합 모드로 초기화
  const metaAgent = await initializeMetaAgent('claude-code') as ClaudeCodeMetaAgent;

  console.log('\n📝 시나리오: 새로운 결제 서비스 코드를 작성했습니다\n');

  const paymentServiceCode = `
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Order } from './entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async processPayment(orderId: string, amount: number) {
    // 주문 조회
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    // 사용자 잔액 확인
    if (order.user.balance < amount) {
      throw new Error('잔액이 부족합니다');
    }

    // 결제 처리
    order.user.balance -= amount;
    order.status = 'paid';

    // 저장
    await this.userRepository.save(order.user);
    await this.orderRepository.save(order);

    return {
      success: true,
      orderId: order.id,
      remainingBalance: order.user.balance,
    };
  }

  async refundPayment(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    order.user.balance += order.amount;
    order.status = 'refunded';

    await this.userRepository.save(order.user);
    await this.orderRepository.save(order);

    return { success: true };
  }
}
  `;

  console.log('코드 미리보기:');
  console.log('─'.repeat(70));
  console.log(paymentServiceCode.trim().split('\n').slice(0, 15).join('\n'));
  console.log('...');
  console.log('─'.repeat(70));

  console.log('\n⚡ 메타 에이전트가 분석을 시작합니다...\n');

  // 코드 작성 이벤트 트리거
  await metaAgent.handleEvent({
    event: TriggerEvent.CODE_WRITTEN,
    filePath: 'backend/src/payment/payment.service.ts',
    code: paymentServiceCode,
    metadata: {
      framework: 'NestJS',
      database: 'TypeORM',
      language: 'TypeScript',
    },
  });

  console.log('\n\n' + '═'.repeat(70));
  console.log('💡 다음 단계');
  console.log('═'.repeat(70));
  console.log(`
위에서 제안된 작업들을 실행하려면:

방법 1: Claude Code에게 직접 요청
  "위에서 제안한 에이전트들을 모두 실행해줘"

방법 2: 개별 실행
  "코드 리뷰만 해줘"
  "테스트 코드만 생성해줘"
  "문서만 생성해줘"

방법 3: 파일 감시 모드 활성화
  npm run dev watch ../backend/src
  (이후 파일 저장 시 자동 실행됨)
  `);

  console.log('═'.repeat(70));
}

demo().catch(console.error);
