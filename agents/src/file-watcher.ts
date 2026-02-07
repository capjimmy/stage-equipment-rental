import * as fs from 'fs';
import * as path from 'path';
import { ExecutionContext, TriggerEvent } from './types.js';
import { MetaAgent } from './meta-agent.js';

/**
 * 파일 변경 감지 및 자동 트리거 시스템
 */
export class FileWatcher {
  private watchedPaths: Set<string> = new Set();
  private metaAgent: MetaAgent;
  private watchers: fs.FSWatcher[] = [];

  constructor(metaAgent: MetaAgent) {
    this.metaAgent = metaAgent;
  }

  /**
   * 디렉토리 감시 시작
   */
  watch(dirPath: string, options?: { recursive?: boolean }): void {
    const absolutePath = path.resolve(dirPath);

    if (this.watchedPaths.has(absolutePath)) {
      console.log(`  ℹ️  이미 감시 중: ${absolutePath}`);
      return;
    }

    console.log(`\n👁️  감시 시작: ${absolutePath}`);
    this.watchedPaths.add(absolutePath);

    const watcher = fs.watch(
      absolutePath,
      { recursive: options?.recursive ?? true },
      (eventType, filename) => {
        if (!filename) return;

        const filePath = path.join(absolutePath, filename);
        this.handleFileChange(eventType, filePath);
      }
    );

    this.watchers.push(watcher);
  }

  /**
   * 파일 변경 처리
   */
  private async handleFileChange(
    eventType: string,
    filePath: string
  ): Promise<void> {
    // 무시할 파일/디렉토리
    if (this.shouldIgnore(filePath)) {
      return;
    }

    console.log(`\n📝 파일 변경 감지: ${filePath} (${eventType})`);

    try {
      // 파일이 존재하는지 확인
      if (!fs.existsSync(filePath)) {
        console.log('  ℹ️  파일이 삭제되었거나 존재하지 않습니다.');
        return;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return;
      }

      // 코드 파일인지 확인
      if (!this.isCodeFile(filePath)) {
        return;
      }

      // 파일 내용 읽기
      const code = fs.readFileSync(filePath, 'utf-8');

      // 이벤트 타입 결정
      const triggerEvent = eventType === 'rename'
        ? TriggerEvent.CODE_WRITTEN
        : TriggerEvent.CODE_MODIFIED;

      // 실행 컨텍스트 생성
      const context: ExecutionContext = {
        event: triggerEvent,
        filePath,
        code,
        metadata: {
          fileSize: stats.size,
          modifiedAt: stats.mtime,
          extension: path.extname(filePath),
        },
      };

      // 메타 에이전트에 이벤트 전달
      await this.metaAgent.handleEvent(context);
    } catch (error) {
      console.error(`  ❌ 파일 처리 중 에러:`, error);
    }
  }

  /**
   * 무시할 파일/디렉토리 확인
   */
  private shouldIgnore(filePath: string): boolean {
    const ignorePaths = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      'coverage',
      '.env',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
    ];

    return ignorePaths.some(ignore =>
      filePath.includes(path.sep + ignore + path.sep) ||
      filePath.endsWith(path.sep + ignore)
    );
  }

  /**
   * 코드 파일인지 확인
   */
  private isCodeFile(filePath: string): boolean {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx',
      '.py', '.java', '.go', '.rs',
      '.c', '.cpp', '.h', '.hpp',
      '.cs', '.php', '.rb', '.swift',
      '.kt', '.scala', '.r', '.m',
    ];

    const ext = path.extname(filePath).toLowerCase();
    return codeExtensions.includes(ext);
  }

  /**
   * 파일에서 함수 생성 감지
   */
  detectFunctionCreation(code: string): boolean {
    const functionPatterns = [
      /function\s+\w+\s*\(/,           // JavaScript function
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/,  // Arrow function
      /export\s+(async\s+)?function/,  // Exported function
      /def\s+\w+\s*\(/,                // Python function
      /public\s+\w+\s+\w+\s*\(/,       // Java/C# method
    ];

    return functionPatterns.some(pattern => pattern.test(code));
  }

  /**
   * 파일에서 API 생성 감지
   */
  detectApiCreation(code: string): boolean {
    const apiPatterns = [
      /@(Get|Post|Put|Delete|Patch)\(/,  // NestJS decorators
      /app\.(get|post|put|delete|patch)\(/,  // Express routes
      /router\.(get|post|put|delete|patch)\(/,  // Router
      /@app\.route\(/,                    // Flask
    ];

    return apiPatterns.some(pattern => pattern.test(code));
  }

  /**
   * 모든 감시 중지
   */
  stopAll(): void {
    console.log('\n🛑 파일 감시 중지');
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    this.watchedPaths.clear();
  }
}
