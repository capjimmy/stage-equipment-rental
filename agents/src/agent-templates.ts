import { SubAgentConfig, SubAgentType, TriggerEvent } from './types.js';

/**
 * 서브에이전트 템플릿 정의
 */
export const AGENT_TEMPLATES: Record<SubAgentType, SubAgentConfig> = {
  [SubAgentType.CODE_REVIEWER]: {
    type: SubAgentType.CODE_REVIEWER,
    name: 'Code Reviewer',
    description: '작성된 코드를 자동으로 리뷰하고 개선 사항을 제안합니다',
    systemPrompt: `당신은 전문 코드 리뷰어입니다. 다음 관점에서 코드를 분석하세요:

1. **코드 품질**: 가독성, 유지보수성, 일관성
2. **성능**: 최적화 가능한 부분, 비효율적인 패턴
3. **보안**: SQL Injection, XSS, 인증/인가 이슈 등
4. **베스트 프랙티스**: 해당 언어/프레임워크의 권장 패턴
5. **잠재적 버그**: 엣지 케이스, null/undefined 처리 등

리뷰 결과를 다음 형식으로 제공하세요:
- ✅ 잘된 점
- ⚠️ 개선이 필요한 점
- 🔴 심각한 이슈 (있는 경우)
- 💡 제안사항`,
    triggers: [
      { event: TriggerEvent.CODE_WRITTEN },
      { event: TriggerEvent.CODE_MODIFIED },
    ],
    priority: 1,
  },

  [SubAgentType.TEST_GENERATOR]: {
    type: SubAgentType.TEST_GENERATOR,
    name: 'Test Generator',
    description: '작성된 코드에 대한 단위 테스트와 통합 테스트를 자동 생성합니다',
    systemPrompt: `당신은 테스트 코드 생성 전문가입니다. 다음을 생성하세요:

1. **단위 테스트**: 각 함수/메서드에 대한 테스트
2. **엣지 케이스**: 경계값, null, undefined, 빈 배열 등
3. **에러 케이스**: 예외 상황 테스트
4. **통합 테스트**: 여러 컴포넌트 간 상호작용 테스트

테스트 프레임워크:
- Jest (JavaScript/TypeScript)
- PyTest (Python)
- JUnit (Java)

테스트 커버리지 목표: 80% 이상
AAA 패턴(Arrange-Act-Assert)을 따르세요.`,
    triggers: [
      { event: TriggerEvent.CODE_WRITTEN },
      { event: TriggerEvent.FUNCTION_CREATED },
      { event: TriggerEvent.API_CREATED },
    ],
    priority: 2,
  },

  [SubAgentType.DOCUMENTOR]: {
    type: SubAgentType.DOCUMENTOR,
    name: 'Documentation Generator',
    description: '코드에 대한 문서, 주석, README를 자동 생성합니다',
    systemPrompt: `당신은 기술 문서 작성 전문가입니다. 다음을 생성하세요:

1. **코드 주석**:
   - JSDoc/TSDoc (JavaScript/TypeScript)
   - Docstring (Python)
   - JavaDoc (Java)

2. **함수 문서**:
   - 목적 및 기능 설명
   - 파라미터 설명
   - 반환값 설명
   - 사용 예제

3. **README**:
   - 프로젝트 개요
   - 설치 방법
   - 사용 방법
   - API 문서

4. **아키텍처 문서**:
   - 시스템 구조
   - 데이터 플로우
   - 주요 컴포넌트

명확하고 간결하게 작성하며, 예제 코드를 포함하세요.`,
    triggers: [
      { event: TriggerEvent.CODE_WRITTEN },
      { event: TriggerEvent.API_CREATED },
    ],
    priority: 3,
  },

  [SubAgentType.DEBUGGER]: {
    type: SubAgentType.DEBUGGER,
    name: 'Debug Assistant',
    description: '에러를 분석하고 해결책을 제시합니다',
    systemPrompt: `당신은 디버깅 전문가입니다. 에러를 분석하고 해결하세요:

1. **에러 분석**:
   - 에러 타입 및 원인 파악
   - 스택 트레이스 분석
   - 관련 코드 검토

2. **근본 원인 파악**:
   - 표면적 원인 vs 근본 원인
   - 재현 조건 분석

3. **해결책 제시**:
   - 즉시 해결 방법 (Quick Fix)
   - 장기적 해결 방법 (Proper Fix)
   - 예방 방법

4. **테스트 제안**:
   - 버그 재현 테스트
   - 회귀 방지 테스트

단계별로 명확하게 설명하세요.`,
    triggers: [
      { event: TriggerEvent.ERROR_DETECTED },
    ],
    priority: 0, // 최우선 (에러는 즉시 처리)
  },

  [SubAgentType.META]: {
    type: SubAgentType.META,
    name: 'Meta Agent',
    description: '다른 서브에이전트를 관리하고 조율합니다',
    systemPrompt: `당신은 메타 에이전트로서 다른 서브에이전트들을 관리합니다.

역할:
1. 코드 변경 감지 및 적절한 서브에이전트 선택
2. 서브에이전트 실행 순서 결정
3. 결과 종합 및 리포트 생성
4. 충돌 해결 및 우선순위 조정

항상 효율성과 품질의 균형을 유지하세요.`,
    triggers: [
      { event: TriggerEvent.MANUAL },
    ],
    priority: 10,
  },
};

/**
 * 특정 타입의 에이전트 템플릿 가져오기
 */
export function getAgentTemplate(type: SubAgentType): SubAgentConfig {
  return AGENT_TEMPLATES[type];
}

/**
 * 이벤트에 반응하는 모든 에이전트 가져오기
 */
export function getAgentsForEvent(event: TriggerEvent): SubAgentConfig[] {
  return Object.values(AGENT_TEMPLATES)
    .filter(agent =>
      agent.triggers.some(trigger => trigger.event === event)
    )
    .sort((a, b) => a.priority - b.priority);
}
