import 'dotenv/config';
import { MetaAgent } from './meta-agent.js';
import { ClaudeCodeMetaAgent } from './claude-code-adapter.js';
import { FileWatcher } from './file-watcher.js';
import { SubAgentType, TriggerEvent, ExecutionContext } from './types.js';

/**
 * 메타 에이전트 초기화 - Claude Code 통합 버전 (권장)
 */
export async function initializeMetaAgent(mode: 'claude-code' | 'standalone' = 'claude-code') {
  if (mode === 'claude-code') {
    // Claude Code와 통합 - 현재 컨텍스트 공유, API 비용 없음
    const metaAgent = new ClaudeCodeMetaAgent({
      autoTrigger: true,
      parallelExecution: true,
      maxConcurrency: 3,
    });

    console.log('🤖 메타 에이전트 시스템 시작됨 (Claude Code 통합 모드)');
    console.log('✅ 현재 대화 컨텍스트를 공유합니다');
    console.log('✅ 추가 API 비용이 발생하지 않습니다');
    console.log('━'.repeat(60));

    return metaAgent;
  } else {
    // 독립 실행 모드 - 별도 API 호출
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY 환경 변수가 설정되지 않았습니다.');
    }

    const metaAgent = new MetaAgent(apiKey, {
      autoTrigger: true,
      parallelExecution: true,
      maxConcurrency: 3,
    });

    console.log('🤖 메타 에이전트 시스템 시작됨 (독립 실행 모드)');
    console.log('⚠️  별도 API 호출을 사용합니다');
    console.log('━'.repeat(60));

    return metaAgent;
  }
}

/**
 * 파일 감시 시작
 */
export async function startFileWatcher(
  metaAgent: MetaAgent,
  paths: string[] = ['../backend/src', '../frontend']
) {
  const watcher = new FileWatcher(metaAgent);

  paths.forEach(p => {
    try {
      watcher.watch(p, { recursive: true });
    } catch (error) {
      console.log(`  ⚠️  경로를 찾을 수 없음: ${p}`);
    }
  });

  console.log('\n✅ 파일 감시 시스템 활성화됨');

  return watcher;
}

/**
 * 수동으로 에이전트 실행하는 헬퍼 함수
 */
export async function runAgent(
  metaAgent: MetaAgent | ClaudeCodeMetaAgent,
  type: SubAgentType,
  context: Partial<ExecutionContext>
) {
  const fullContext: ExecutionContext = {
    event: TriggerEvent.MANUAL,
    ...context,
  };

  return metaAgent.executeAgent(type, fullContext);
}

/**
 * CLI 모드로 실행
 */
export async function runCLI() {
  try {
    const metaAgent = await initializeMetaAgent('standalone');

    // 명령행 인자 파싱
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'watch':
        // 파일 감시 모드
        const paths = args.slice(1);
        const watcher = await startFileWatcher(
          metaAgent as MetaAgent,
          paths.length > 0 ? paths : undefined
        );

        console.log('\n🔍 파일 변경을 감시하고 있습니다...');
        console.log('종료하려면 Ctrl+C를 누르세요.');

        // 종료 시그널 처리
        process.on('SIGINT', () => {
          console.log('\n\n종료 중...');
          watcher.stopAll();
          process.exit(0);
        });
        break;

      case 'review':
        // 특정 파일 리뷰
        const filePath = args[1];
        if (!filePath) {
          console.error('❌ 파일 경로를 지정해주세요.');
          process.exit(1);
        }

        const fs = await import('fs');
        const code = fs.readFileSync(filePath, 'utf-8');

        await runAgent(metaAgent, SubAgentType.CODE_REVIEWER, {
          filePath,
          code,
        });
        break;

      case 'test':
        // 테스트 생성
        const testFilePath = args[1];
        if (!testFilePath) {
          console.error('❌ 파일 경로를 지정해주세요.');
          process.exit(1);
        }

        const fs2 = await import('fs');
        const testCode = fs2.readFileSync(testFilePath, 'utf-8');

        await runAgent(metaAgent, SubAgentType.TEST_GENERATOR, {
          filePath: testFilePath,
          code: testCode,
        });
        break;

      case 'doc':
        // 문서 생성
        const docFilePath = args[1];
        if (!docFilePath) {
          console.error('❌ 파일 경로를 지정해주세요.');
          process.exit(1);
        }

        const fs3 = await import('fs');
        const docCode = fs3.readFileSync(docFilePath, 'utf-8');

        await runAgent(metaAgent, SubAgentType.DOCUMENTOR, {
          filePath: docFilePath,
          code: docCode,
        });
        break;

      case 'help':
      default:
        console.log(`
사용법:
  npm run dev watch [paths...]     - 파일 감시 모드로 실행
  npm run dev review <file>        - 특정 파일 리뷰
  npm run dev test <file>          - 테스트 코드 생성
  npm run dev doc <file>           - 문서 생성
  npm run dev help                 - 도움말 표시

예제:
  npm run dev watch ../backend/src
  npm run dev review ../backend/src/users/users.service.ts
  npm run dev test ../backend/src/users/users.service.ts
  npm run dev doc ../backend/src/users/users.service.ts
        `);
        break;
    }
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

// 모듈 직접 실행 시 CLI 모드
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}

// Export for programmatic use
export * from './types.js';
export * from './meta-agent.js';
export * from './claude-code-adapter.js';
export * from './file-watcher.js';
export * from './agent-templates.js';
