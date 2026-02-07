# 🤖 자동 서브에이전트 시스템

코딩 중에 필요한 서브에이전트를 자동으로 생성하고 실행하는 메타 에이전트 시스템입니다.

## ✨ 주요 기능

### 1. 자동 코드 리뷰
- ✅ 코드 품질 분석
- ⚠️ 보안 취약점 검사
- 💡 개선 사항 제안
- 🔍 베스트 프랙티스 적용

### 2. 테스트 자동 생성
- 단위 테스트 생성
- 엣지 케이스 커버
- 통합 테스트 작성
- 80% 이상 커버리지 목표

### 3. 문서 자동화
- JSDoc/TSDoc 주석 생성
- API 문서 작성
- README 생성
- 사용 예제 포함

### 4. 디버깅 어시스턴트
- 에러 원인 분석
- 해결 방법 제시
- 예방 전략 제안
- 테스트 케이스 생성

## 🚀 설치 및 설정

### 1. 의존성 설치

```bash
cd agents
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Anthropic API 키를 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일:
```
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929
DEBUG=false
```

### 3. 빌드

```bash
npm run build
```

## 📖 사용 방법

### CLI 모드

#### 파일 감시 모드 (자동 실행)

```bash
# 기본 경로 감시
npm run dev watch

# 특정 경로 감시
npm run dev watch ../backend/src ../frontend/src

# 여러 경로 감시
npm run dev watch ../backend ../frontend
```

파일이 변경되면 자동으로 적절한 서브에이전트가 실행됩니다:
- 새 코드 작성 → 리뷰, 테스트, 문서 생성
- 코드 수정 → 리뷰 실행
- 에러 발생 → 디버거 실행

#### 수동 실행

```bash
# 코드 리뷰
npm run dev review ../backend/src/users/users.service.ts

# 테스트 생성
npm run dev test ../backend/src/users/users.service.ts

# 문서 생성
npm run dev doc ../backend/src/users/users.service.ts
```

### 프로그래밍 방식 사용

```typescript
import { initializeMetaAgent, runAgent, SubAgentType } from './src/index.js';

// 메타 에이전트 초기화
const metaAgent = await initializeMetaAgent();

// 특정 에이전트 실행
const result = await runAgent(metaAgent, SubAgentType.CODE_REVIEWER, {
  filePath: 'user.service.ts',
  code: '...',
});

console.log(result.output);
```

### 파일 감시와 함께 사용

```typescript
import { initializeMetaAgent, startFileWatcher } from './src/index.js';

const metaAgent = await initializeMetaAgent();

// 파일 감시 시작
const watcher = await startFileWatcher(metaAgent, [
  '../backend/src',
  '../frontend/src'
]);

// 이제 파일이 변경되면 자동으로 에이전트가 실행됩니다
```

## 🎯 서브에이전트 타입

### 1. Code Reviewer (`code-reviewer`)
**트리거**: 코드 작성, 코드 수정

**분석 항목**:
- 코드 품질 (가독성, 유지보수성)
- 성능 최적화
- 보안 취약점 (SQL Injection, XSS 등)
- 베스트 프랙티스 준수

**출력 형식**:
```
✅ 잘된 점
- 명확한 함수명 사용
- 적절한 에러 핸들링

⚠️ 개선이 필요한 점
- 타입 정의 누락
- 입력 값 검증 필요

💡 제안사항
- DTO 클래스 사용 권장
```

### 2. Test Generator (`test-generator`)
**트리거**: 코드 작성, 함수 생성, API 생성

**생성 내용**:
- 단위 테스트 (각 함수별)
- 엣지 케이스 테스트
- 에러 케이스 테스트
- 통합 테스트

**예제**:
```typescript
describe('UserService', () => {
  it('should create a user', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@example.com' };

    // Act
    const result = await userService.create(userData);

    // Assert
    expect(result).toHaveProperty('id');
    expect(result.name).toBe('John');
  });
});
```

### 3. Documentor (`documentor`)
**트리거**: 코드 작성, API 생성

**생성 내용**:
- JSDoc/TSDoc 주석
- 함수 설명 및 파라미터 문서
- API 엔드포인트 문서
- 사용 예제

**예제**:
```typescript
/**
 * 사용자를 생성합니다.
 *
 * @param data - 사용자 생성 데이터
 * @param data.name - 사용자 이름
 * @param data.email - 사용자 이메일
 * @returns 생성된 사용자 객체
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * });
 * ```
 */
async function createUser(data: CreateUserDto): Promise<User> {
  // ...
}
```

### 4. Debugger (`debugger`)
**트리거**: 에러 감지

**분석 내용**:
- 에러 타입 및 원인
- 스택 트레이스 분석
- 근본 원인 파악
- 해결 방법 제시

**출력 형식**:
```
🔍 에러 분석
원인: null/undefined 체크 누락

🔧 즉시 해결 (Quick Fix)
if (!order.user) {
  throw new Error('User not found');
}

💎 장기적 해결 (Proper Fix)
- DTO 클래스에 검증 데코레이터 추가
- TypeScript strict mode 활성화

🧪 테스트 제안
- user가 null인 경우 테스트 추가
```

## ⚙️ 설정

### 메타 에이전트 설정

```typescript
const metaAgent = new MetaAgent(apiKey, {
  autoTrigger: true,          // 자동 트리거 활성화
  parallelExecution: true,    // 병렬 실행 허용
  maxConcurrency: 3,          // 최대 동시 실행 수
});
```

### 감시 경로 설정

```typescript
const watcher = new FileWatcher(metaAgent);

// 특정 디렉토리 감시
watcher.watch('../backend/src', { recursive: true });
watcher.watch('../frontend/src', { recursive: true });
```

## 🔧 커스터마이징

### 새로운 서브에이전트 추가

`src/agent-templates.ts`에 새로운 에이전트를 추가할 수 있습니다:

```typescript
export const AGENT_TEMPLATES: Record<SubAgentType, SubAgentConfig> = {
  // ... 기존 에이전트들

  [SubAgentType.CUSTOM_AGENT]: {
    type: SubAgentType.CUSTOM_AGENT,
    name: 'Custom Agent',
    description: '커스텀 에이전트 설명',
    systemPrompt: '에이전트가 수행할 작업에 대한 상세한 프롬프트...',
    triggers: [
      { event: TriggerEvent.CODE_WRITTEN },
    ],
    priority: 5,
  },
};
```

### 트리거 조건 추가

조건부 트리거를 설정할 수 있습니다:

```typescript
triggers: [
  {
    event: TriggerEvent.CODE_WRITTEN,
    condition: (context) => {
      // TypeScript 파일만 처리
      return context.filePath?.endsWith('.ts') ?? false;
    }
  }
]
```

## 📊 실행 결과 예제

```
🤖 [메타 에이전트] 이벤트 처리: code_written
  📋 3개의 에이전트가 트리거됨:
    - Code Reviewer (우선순위: 1)
    - Test Generator (우선순위: 2)
    - Documentation Generator (우선순위: 3)

  ⚙️  [code-reviewer] 실행 중...
  ✅ [code-reviewer] 완료 (1245ms)

  ⚙️  [test-generator] 실행 중...
  ✅ [test-generator] 완료 (2103ms)

  ⚙️  [documentor] 실행 중...
  ✅ [documentor] 완료 (1876ms)

📊 실행 결과 요약:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  총 실행: 3개
  성공: 3개 | 실패: 0개
  총 소요 시간: 5224ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🎓 예제 실행

전체 기능을 확인하려면 예제 파일을 실행하세요:

```bash
npm run dev
# 또는
tsx examples/basic-usage.ts
```

## 🛠️ 개발

```bash
# TypeScript 컴파일
npm run build

# Watch 모드로 개발
npm run dev

# 타입 체크
tsc --noEmit
```

## 📝 라이선스

MIT

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 💡 팁

1. **API 키 보안**: `.env` 파일을 `.gitignore`에 추가하세요
2. **성능 최적화**: `maxConcurrency`를 조정하여 동시 실행 수를 제어하세요
3. **선택적 실행**: 특정 파일/디렉토리만 감시하도록 경로를 지정하세요
4. **히스토리 관리**: `metaAgent.getHistory()`로 실행 기록을 확인하세요
