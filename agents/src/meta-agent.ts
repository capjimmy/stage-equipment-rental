import Anthropic from '@anthropic-ai/sdk';
import {
  SubAgentType,
  ExecutionContext,
  AgentResult,
  MetaAgentConfig,
  TriggerEvent,
} from './types.js';
import { getAgentsForEvent, getAgentTemplate } from './agent-templates.js';

/**
 * 메타 에이전트 - 서브에이전트를 자동으로 생성하고 관리
 */
export class MetaAgent {
  private client: Anthropic;
  private config: MetaAgentConfig;
  private executionHistory: AgentResult[] = [];

  constructor(apiKey: string, config?: Partial<MetaAgentConfig>) {
    this.client = new Anthropic({ apiKey });
    this.config = {
      autoTrigger: true,
      parallelExecution: true,
      maxConcurrency: 3,
      ...config,
    };
  }

  /**
   * 이벤트 발생 시 자동으로 필요한 서브에이전트 실행
   */
  async handleEvent(context: ExecutionContext): Promise<AgentResult[]> {
    console.log(`\n🤖 [메타 에이전트] 이벤트 처리: ${context.event}`);

    // 이벤트에 반응하는 에이전트들 찾기
    const agents = getAgentsForEvent(context.event);

    if (agents.length === 0) {
      console.log('  ℹ️  해당 이벤트에 대한 에이전트가 없습니다.');
      return [];
    }

    console.log(`  📋 ${agents.length}개의 에이전트가 트리거됨:`);
    agents.forEach(agent => {
      console.log(`    - ${agent.name} (우선순위: ${agent.priority})`);
    });

    // 에이전트 실행
    const results = this.config.parallelExecution
      ? await this.executeParallel(agents, context)
      : await this.executeSequential(agents, context);

    // 결과 저장
    this.executionHistory.push(...results);

    // 결과 요약 출력
    this.printSummary(results);

    return results;
  }

  /**
   * 수동으로 특정 에이전트 실행
   */
  async executeAgent(
    type: SubAgentType,
    context: ExecutionContext
  ): Promise<AgentResult> {
    const template = getAgentTemplate(type);
    console.log(`\n🎯 [수동 실행] ${template.name}`);

    return this.runAgent(template.type, template.systemPrompt, context);
  }

  /**
   * 병렬 실행
   */
  private async executeParallel(
    agents: any[],
    context: ExecutionContext
  ): Promise<AgentResult[]> {
    const chunks = this.chunkArray(agents, this.config.maxConcurrency);
    const results: AgentResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(agent =>
          this.runAgent(agent.type, agent.systemPrompt, context)
        )
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * 순차 실행
   */
  private async executeSequential(
    agents: any[],
    context: ExecutionContext
  ): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    for (const agent of agents) {
      const result = await this.runAgent(
        agent.type,
        agent.systemPrompt,
        context
      );
      results.push(result);
    }

    return results;
  }

  /**
   * 개별 에이전트 실행
   */
  private async runAgent(
    type: SubAgentType,
    systemPrompt: string,
    context: ExecutionContext
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const userMessage = this.buildUserMessage(context);

      console.log(`\n  ⚙️  [${type}] 실행 중...`);

      const response = await this.client.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const output = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      const executionTime = Date.now() - startTime;

      console.log(`  ✅ [${type}] 완료 (${executionTime}ms)`);

      return {
        agentType: type,
        success: true,
        output,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(`  ❌ [${type}] 실패: ${errorMessage}`);

      return {
        agentType: type,
        success: false,
        output: '',
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * 사용자 메시지 생성
   */
  private buildUserMessage(context: ExecutionContext): string {
    let message = `이벤트: ${context.event}\n\n`;

    if (context.filePath) {
      message += `파일 경로: ${context.filePath}\n\n`;
    }

    if (context.code) {
      message += `코드:\n\`\`\`\n${context.code}\n\`\`\`\n\n`;
    }

    if (context.error) {
      message += `에러:\n${context.error.stack || context.error.message}\n\n`;
    }

    if (context.metadata) {
      message += `추가 정보:\n${JSON.stringify(context.metadata, null, 2)}\n`;
    }

    message += '\n위 내용을 분석하고 결과를 제공해주세요.';

    return message;
  }

  /**
   * 결과 요약 출력
   */
  private printSummary(results: AgentResult[]): void {
    console.log('\n📊 실행 결과 요약:');
    console.log('━'.repeat(60));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    console.log(`  총 실행: ${results.length}개`);
    console.log(`  성공: ${successful}개 | 실패: ${failed}개`);
    console.log(`  총 소요 시간: ${totalTime}ms`);
    console.log('━'.repeat(60));

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`\n${icon} ${result.agentType}:`);
      if (result.success) {
        console.log(result.output.slice(0, 200) + '...');
      } else {
        console.log(`  에러: ${result.error}`);
      }
    });
  }

  /**
   * 배열을 청크로 나누기
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 실행 히스토리 가져오기
   */
  getHistory(): AgentResult[] {
    return [...this.executionHistory];
  }

  /**
   * 히스토리 초기화
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}
