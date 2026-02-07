# 🔄 컨텍스트 공유 방식 설명

## 질문: "해당 에이전트들은 어디 컨텍스트를 사용해?"

### ✅ **Claude Code 통합 모드** (기본, 권장)

**현재 대화의 컨텍스트를 공유합니다!**

```typescript
const metaAgent = await initializeMetaAgent('claude-code');
```

#### 작동 방식:
1. 메타 에이전트가 코드 변경을 감지
2. 필요한 서브에이전트 작업을 **제안**
3. **당신(사용자)이 Claude Code에게 실행 요청**
4. Claude Code가 **현재 대화 컨텍스트 내에서** Task를 실행

#### 장점:
- ✅ **같은 컨텍스트 공유**: 지금까지의 대화 내용을 모두 알고 있음
- ✅ **추가 API 비용 없음**: 현재 대화에 포함됨
- ✅ **일관성**: Claude Code와 동일한 이해도로 작업
- ✅ **통합성**: 프로젝트 전체 맥락 파악

#### 예시:
```
[메타 에이전트]
  "코드 리뷰가 필요합니다"

[당신]
  "위에서 제안한 코드 리뷰 해줘"

[Claude Code]
  "네, 현재 프로젝트 맥락을 고려해서 리뷰하겠습니다..."
  (현재 대화의 모든 정보 활용)
```

---

### ⚠️ **독립 실행 모드**

**별도의 새로운 컨텍스트를 사용합니다**

```typescript
const metaAgent = await initializeMetaAgent('standalone');
```

#### 작동 방식:
1. Anthropic API를 **직접 호출**
2. **새로운 대화 세션** 생성
3. 코드만 전달하여 분석

#### 단점:
- ❌ **별도 컨텍스트**: 현재 대화 내용 모름
- ❌ **추가 API 비용 발생**: 별도 요청
- ❌ **단절성**: 프로젝트 전체 맥락 부족
- ❌ **API 키 필요**: ANTHROPIC_API_KEY 설정 필요

#### 언제 사용?
- CI/CD 파이프라인에서 자동 실행
- 완전히 독립적인 도구로 사용
- Claude Code 없이 사용

---

## 🎯 비교표

| 항목 | Claude Code 통합 | 독립 실행 |
|------|-----------------|----------|
| **컨텍스트** | 현재 대화 공유 ✅ | 별도 세션 ❌ |
| **API 비용** | 없음 ✅ | 발생 ❌ |
| **프로젝트 이해도** | 높음 ✅ | 낮음 ⚠️ |
| **설정 복잡도** | 낮음 ✅ | API 키 필요 ⚠️ |
| **사용 방식** | 대화형 💬 | 자동화 🤖 |

---

## 📚 실제 사용 예제

### Claude Code 통합 모드 (권장)

```bash
# 1. 데모 실행
npm run demo

# 출력:
# 🤖 메타 에이전트가 분석을 시작합니다...
# 📋 3개의 에이전트가 트리거됨:
#   - Code Reviewer (우선순위: 1)
#   - Test Generator (우선순위: 2)
#   - Documentation Generator (우선순위: 3)
#
# 💡 Claude Code에게 요청하세요:
#   "위에서 제안한 에이전트들을 실행해줘"
```

```typescript
// 2. 그러면 Claude Code가 현재 컨텍스트로 실행
// - 프로젝트 구조 이해
// - 이전 대화 내용 참조
// - 일관된 코딩 스타일 유지
```

### 독립 실행 모드

```bash
# 1. API 키 설정 필요
ANTHROPIC_API_KEY=sk-...

# 2. 실행
const metaAgent = await initializeMetaAgent('standalone');

# 3. 자동으로 API 호출
# - 새 세션 생성
# - 코드만 전달
# - 비용 발생
```

---

## 🚀 시작하기

### 1. 기본 설치

```bash
cd agents
npm install
```

### 2. 데모 실행 (Claude Code 통합)

```bash
npm run demo
```

### 3. Claude Code에게 요청

```
"위에서 제안한 에이전트들을 실행해줘"
```

또는

```
"코드 리뷰만 해줘"
"테스트 코드 생성해줘"
"문서 작성해줘"
```

### 4. 파일 감시 모드 (자동화)

```bash
npm run dev watch ../backend/src
```

이제 파일을 저장할 때마다:
1. 메타 에이전트가 변경 감지
2. 필요한 에이전트 제안
3. 당신이 Claude Code에게 실행 요청
4. **현재 컨텍스트로 실행** ✨

---

## 💡 핵심 포인트

### ✅ Claude Code 통합 모드를 사용하면:

1. **당신의 Claude Code 컨텍스트를 사용합니다**
   - 지금까지의 모든 대화 내용
   - 프로젝트 구조 이해
   - 코딩 스타일 파악

2. **추가 비용이 없습니다**
   - 현재 대화의 일부로 처리
   - 별도 API 호출 없음

3. **더 똑똑합니다**
   - 프로젝트 전체 맥락 파악
   - 일관된 제안
   - 통합된 경험

---

## 📖 더 알아보기

- [agents/README.md](README.md) - 전체 문서
- [examples/claude-code-integration.ts](examples/claude-code-integration.ts) - 통합 예제
- [demo.ts](demo.ts) - 빠른 데모
