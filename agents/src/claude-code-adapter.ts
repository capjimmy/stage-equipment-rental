/**
 * Claude Code의 Task tool을 사용하는 어댑터
 *
 * 이 어댑터는 Claude Code와 통합되어 현재 대화 컨텍스트를 공유하면서
 * 서브에이전트를 실행합니다.
 */

import {
  SubAgentType,
  ExecutionContext,
  AgentResult,
  MetaAgentConfig,
  TriggerEvent,
} from './types.js';
import { getAgentsForEvent, getAgentTemplate } from './agent-templates.js';

/**
 * Claude Code와 통합된 메타 에이전트
 *
 * 이 클래스는 실제로 API를 호출하지 않고,
 * 대신 Claude Code에게 Task를 생성하도록 요청하는 명령을 출력합니다.
 */
export class ClaudeCodeMetaAgent {
  private config: MetaAgentConfig;
  private executionHistory: AgentResult[] = [];
  private pendingTasks: Map<string, ExecutionContext> = new Map();

  constructor(config?: Partial<MetaAgentConfig>) {
    this.config = {
      autoTrigger: true,
      parallelExecution: true,
      maxConcurrency: 3,
      ...config,
    };
  }

  /**
   * 이벤트 발생 시 자동으로 필요한 서브에이전트 실행 요청
   */
  async handleEvent(context: ExecutionContext): Promise<void> {
    console.log(`\n🤖 [메타 에이전트] 이벤트 처리: ${context.event}`);

    // 이벤트에 반응하는 에이전트들 찾기
    const agents = getAgentsForEvent(context.event);

    if (agents.length === 0) {
      console.log('  ℹ️  해당 이벤트에 대한 에이전트가 없습니다.');
      return;
    }

    console.log(`  📋 ${agents.length}개의 에이전트가 트리거됨:`);
    agents.forEach(agent => {
      console.log(`    - ${agent.name} (우선순위: ${agent.priority})`);
    });

    // Claude Code에게 Task 실행 요청
    this.requestTaskExecution(agents, context);
  }

  /**
   * 수동으로 특정 에이전트 실행 요청
   */
  async executeAgent(
    type: SubAgentType,
    context: ExecutionContext
  ): Promise<void> {
    const template = getAgentTemplate(type);
    console.log(`\n🎯 [수동 실행] ${template.name}`);

    this.requestTaskExecution([template], context);
  }

  /**
   * Claude Code에게 Task 실행 요청
   *
   * 이 메서드는 실제로 Task를 생성하지 않고,
   * Claude Code가 인식할 수 있는 형식으로 요청 정보를 출력합니다.
   */
  private requestTaskExecution(
    agents: any[],
    context: ExecutionContext
  ): void {
    console.log('\n' + '━'.repeat(60));
    console.log('📤 Claude Code Task 실행 요청');
    console.log('━'.repeat(60));

    agents.forEach((agent, index) => {
      const taskId = `agent-${Date.now()}-${index}`;
      const prompt = this.buildTaskPrompt(agent, context);

      this.pendingTasks.set(taskId, context);

      console.log(`\n🔷 Task ${index + 1}/${agents.length}: ${agent.name}`);
      console.log(`   타입: ${agent.type}`);
      console.log(`   설명: ${agent.description}`);
      console.log(`\n   실행할 프롬프트:`);
      console.log('   ' + '─'.repeat(56));
      console.log(this.formatPromptForDisplay(prompt));
      console.log('   ' + '─'.repeat(56));
    });

    console.log('\n💡 위 작업을 실행하려면 다음과 같이 요청하세요:');
    console.log('   "위에서 제안한 에이전트들을 실행해줘"');
    console.log('━'.repeat(60));
  }

  /**
   * Task 프롬프트 생성
   */
  private buildTaskPrompt(agent: any, context: ExecutionContext): string {
    let prompt = `${agent.systemPrompt}\n\n`;

    prompt += `## 분석 대상\n\n`;

    if (context.filePath) {
      prompt += `📁 파일: ${context.filePath}\n\n`;
    }

    if (context.code) {
      prompt += `### 코드\n\`\`\`typescript\n${context.code}\n\`\`\`\n\n`;
    }

    if (context.error) {
      prompt += `### 에러\n\`\`\`\n${context.error.stack || context.error.message}\n\`\`\`\n\n`;
    }

    if (context.metadata) {
      prompt += `### 추가 정보\n\`\`\`json\n${JSON.stringify(context.metadata, null, 2)}\n\`\`\`\n\n`;
    }

    prompt += `위 내용을 분석하고 결과를 제공해주세요.`;

    return prompt;
  }

  /**
   * 프롬프트를 보기 좋게 포맷팅
   */
  private formatPromptForDisplay(prompt: string): string {
    const lines = prompt.split('\n');
    const maxLines = 10;

    if (lines.length <= maxLines) {
      return lines.map(line => `   ${line}`).join('\n');
    }

    const preview = lines.slice(0, maxLines).map(line => `   ${line}`).join('\n');
    return `${preview}\n   ... (${lines.length - maxLines}줄 더 있음)`;
  }

  /**
   * 결과 기록
   */
  recordResult(result: AgentResult): void {
    this.executionHistory.push(result);
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
    this.pendingTasks.clear();
  }

  /**
   * 에이전트 정보를 JSON 형식으로 반환 (프로그래밍 방식 사용)
   */
  getTaskRequests(agents: any[], context: ExecutionContext): TaskRequest[] {
    return agents.map(agent => ({
      agentType: agent.type,
      agentName: agent.name,
      description: agent.description,
      prompt: this.buildTaskPrompt(agent, context),
      priority: agent.priority,
    }));
  }
}

/**
 * Task 요청 정보
 */
export interface TaskRequest {
  agentType: SubAgentType;
  agentName: string;
  description: string;
  prompt: string;
  priority: number;
}

/**
 * Claude Code에서 Task를 실제로 실행하는 헬퍼 함수
 *
 * 사용 예:
 * const tasks = await executeTasksInClaudeCode(requests);
 */
export function generateTaskExecutionInstructions(
  requests: TaskRequest[]
): string {
  let instructions = '다음 에이전트들을 병렬로 실행해주세요:\n\n';

  requests.forEach((req, index) => {
    instructions += `${index + 1}. **${req.agentName}** (${req.agentType})\n`;
    instructions += `   - ${req.description}\n`;
    instructions += `   - 우선순위: ${req.priority}\n\n`;
  });

  instructions += '각 에이전트에 대해 다음 작업을 수행해주세요:\n';
  instructions += '1. 코드 분석 및 검토\n';
  instructions += '2. 개선 사항 제안\n';
  instructions += '3. 필요시 예제 코드 생성\n';

  return instructions;
}
