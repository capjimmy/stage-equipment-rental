/**
 * 서브에이전트 타입 정의
 */
export enum SubAgentType {
  CODE_REVIEWER = 'code-reviewer',
  TEST_GENERATOR = 'test-generator',
  DOCUMENTOR = 'documentor',
  DEBUGGER = 'debugger',
  META = 'meta-agent', // 메타 에이전트 자신
}

/**
 * 서브에이전트 설정
 */
export interface SubAgentConfig {
  type: SubAgentType;
  name: string;
  description: string;
  systemPrompt: string;
  triggers: AgentTrigger[];
  priority: number; // 실행 우선순위 (낮을수록 먼저 실행)
}

/**
 * 에이전트 트리거 조건
 */
export interface AgentTrigger {
  event: TriggerEvent;
  condition?: (context: ExecutionContext) => boolean;
}

/**
 * 트리거 이벤트 타입
 */
export enum TriggerEvent {
  CODE_WRITTEN = 'code_written',
  CODE_MODIFIED = 'code_modified',
  ERROR_DETECTED = 'error_detected',
  FUNCTION_CREATED = 'function_created',
  API_CREATED = 'api_created',
  MANUAL = 'manual',
}

/**
 * 실행 컨텍스트
 */
export interface ExecutionContext {
  event: TriggerEvent;
  filePath?: string;
  code?: string;
  error?: Error;
  metadata?: Record<string, any>;
}

/**
 * 에이전트 실행 결과
 */
export interface AgentResult {
  agentType: SubAgentType;
  success: boolean;
  output: string;
  suggestions?: string[];
  filesGenerated?: string[];
  error?: string;
  executionTime: number;
}

/**
 * 메타 에이전트 설정
 */
export interface MetaAgentConfig {
  autoTrigger: boolean; // 자동 트리거 활성화
  parallelExecution: boolean; // 병렬 실행 허용
  maxConcurrency: number; // 최대 동시 실행 수
}
