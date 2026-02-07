# 모바일 테스트 가이드

## 목차
1. [디바이스별 테스트 방법](#1-디바이스별-테스트-방법)
2. [브레이크포인트별 체크포인트](#2-브레이크포인트별-체크포인트)
3. [터치 인터랙션 테스트](#3-터치-인터랙션-테스트)
4. [성능 측정 방법](#4-성능-측정-방법)

---

## 1. 디바이스별 테스트 방법

### 1.1 실제 디바이스 테스트

#### iOS 디바이스 테스트

**준비사항:**
- iPhone (여러 모델 권장)
- Mac 컴퓨터 (Safari 개발자 도구용)
- Lightning/USB-C 케이블

**테스트 절차:**
1. iPhone의 Safari 설정에서 "고급 > 웹 속성" 활성화
2. Mac의 Safari에서 "개발" 메뉴 활성화
3. iPhone을 Mac에 연결
4. iPhone에서 테스트할 URL 접속
5. Mac의 Safari > 개발 > [iPhone 이름] > [페이지]로 접속
6. 개발자 도구를 통해 디버깅

**테스트 대상 디바이스:**
- iPhone SE (작은 화면: 375x667)
- iPhone 12/13/14 (중간 화면: 390x844)
- iPhone 14 Pro Max (큰 화면: 430x932)

**주요 확인사항:**
- [ ] Safari 렌더링 이슈
- [ ] Safe Area 처리 (노치 대응)
- [ ] iOS 제스처와의 충돌 (뒤로가기 스와이프)
- [ ] Form 입력 시 키보드 높이 대응

#### Android 디바이스 테스트

**준비사항:**
- Android 폰 (여러 제조사 권장)
- USB 케이블
- Chrome DevTools

**테스트 절차:**
1. Android 설정에서 "개발자 옵션" 활성화
2. "USB 디버깅" 활성화
3. PC의 Chrome에서 `chrome://inspect` 접속
4. 디바이스 연결 및 권한 승인
5. 원격 디버깅 시작

**테스트 대상 디바이스:**
- Samsung Galaxy S 시리즈
- Google Pixel
- Xiaomi/OnePlus (해외 시장 대응)

**주요 확인사항:**
- [ ] Chrome 렌더링 이슈
- [ ] Android 시스템 UI와의 충돌
- [ ] 뒤로가기 버튼 동작
- [ ] 다양한 화면 해상도 대응

---

### 1.2 브라우저 개발자 도구 테스트

#### Chrome DevTools 반응형 모드

**사용법:**
1. Chrome에서 테스트 페이지 열기
2. `F12` 또는 `Cmd+Opt+I` (Mac)로 개발자 도구 열기
3. `Cmd+Shift+M` (Mac) / `Ctrl+Shift+M` (Win)으로 디바이스 모드 전환
4. 디바이스 프리셋 선택 또는 커스텀 크기 설정

**테스트 시나리오:**
```
1. 디바이스 프리셋 테스트
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad Air (820x1180)
   - Samsung Galaxy S20 Ultra (412x915)
   - Surface Pro 7 (912x1368)

2. 네트워크 속도 시뮬레이션
   - Fast 3G
   - Slow 3G
   - Offline

3. 터치 이벤트 시뮬레이션
   - Touch 모드 활성화
   - 스크롤 테스트
   - 탭/롱프레스 테스트
```

#### Firefox Responsive Design Mode

**사용법:**
1. Firefox에서 `Cmd+Opt+M` (Mac) / `Ctrl+Shift+M` (Win)
2. 다양한 디바이스 프리셋 선택
3. DPR(Device Pixel Ratio) 조정 가능

**장점:**
- 스크린샷 캡처 기능
- 터치 이벤트 시뮬레이션
- 회전 테스트 간편

---

### 1.3 에뮬레이터/시뮬레이터 테스트

#### iOS 시뮬레이터 (Mac 전용)

**설치:**
```bash
# Xcode 설치 (App Store)
# Xcode Command Line Tools 설치
xcode-select --install

# 시뮬레이터 실행
open -a Simulator
```

**테스트 절차:**
1. Xcode > Open Developer Tool > Simulator
2. 원하는 디바이스 선택 (Device > iOS 버전 > 모델)
3. Safari에서 테스트 URL 접속
4. 회전, 핀치 줌 등 제스처 테스트

#### Android Emulator

**설치:**
```bash
# Android Studio 설치
# AVD Manager에서 가상 디바이스 생성

# 커맨드라인으로 에뮬레이터 실행
emulator -avd Pixel_5_API_30
```

**테스트 절차:**
1. Android Studio > Tools > AVD Manager
2. Virtual Device 생성 (다양한 API 레벨 테스트)
3. Chrome에서 테스트 URL 접속
4. 회전, 뒤로가기 등 테스트

---

### 1.4 클라우드 디바이스 테스팅 서비스

#### BrowserStack

**사용법:**
```bash
# 회원가입 후 Live Testing 선택
# 원하는 디바이스 및 OS 선택
# URL 입력 후 테스트 시작
```

**추천 테스트 조합:**
- iPhone 13 / iOS 15 / Safari
- iPhone SE / iOS 16 / Safari
- Samsung Galaxy S21 / Android 11 / Chrome
- Google Pixel 5 / Android 12 / Chrome

#### LambdaTest

**장점:**
- 실시간 테스팅
- 스크린샷/비디오 녹화
- 로컬호스트 터널링 지원

---

## 2. 브레이크포인트별 체크포인트

### 2.1 모바일 (< 640px)

#### 레이아웃 체크리스트

**네비게이션:**
- [ ] 햄버거 메뉴 아이콘 표시
- [ ] 메뉴 오픈 시 전체 화면 오버레이
- [ ] 메뉴 닫기 버튼 위치 및 크기
- [ ] 로고 중앙 배치 또는 좌측 상단 배치

**컨텐츠:**
- [ ] 상품 그리드 1열 표시
- [ ] 카드 간격 적절 (최소 16px)
- [ ] 이미지 비율 유지 (aspect-ratio)
- [ ] 텍스트 줄바꿈 정상 작동

**폼 요소:**
- [ ] 입력 필드 최소 높이 44px (터치 가능)
- [ ] 버튼 최소 크기 44x44px
- [ ] 라벨과 입력 필드 수직 배치
- [ ] 키보드 오픈 시 입력 필드 자동 스크롤

**푸터:**
- [ ] 정보 섹션 수직 스택
- [ ] 하단 고정 버튼이 있다면 Safe Area 고려
- [ ] 소셜 미디어 아이콘 크기 적절

**코드 예시:**
```css
/* 모바일 기본 스타일 */
@media (max-width: 639px) {
  /* 네비게이션 */
  .nav-menu {
    display: none;
  }

  .hamburger-menu {
    display: block;
    width: 44px;
    height: 44px;
  }

  /* 상품 그리드 */
  .product-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 0 16px;
  }

  /* 폼 요소 */
  input, button {
    min-height: 44px;
    font-size: 16px; /* iOS 줌 방지 */
  }

  /* 상품 카드 */
  .product-card {
    width: 100%;
  }
}
```

---

### 2.2 태블릿 (640px - 1024px)

#### 레이아웃 체크리스트

**네비게이션:**
- [ ] 축소된 네비게이션 또는 햄버거 메뉴
- [ ] 로고 + 주요 메뉴 노출
- [ ] 사이드바 토글 가능

**컨텐츠:**
- [ ] 상품 그리드 2-3열 표시
- [ ] 사이드바 + 메인 컨텐츠 레이아웃
- [ ] 이미지 갤러리 2-3열

**폼 요소:**
- [ ] 2열 폼 레이아웃 (이름/성 나란히)
- [ ] 드롭다운 선택 박스 크기 적절

**코드 예시:**
```css
@media (min-width: 640px) and (max-width: 1023px) {
  .nav-menu {
    display: flex;
    gap: 24px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}
```

---

### 2.3 데스크탑 (> 1024px)

#### 레이아웃 체크리스트

**네비게이션:**
- [ ] 전체 메뉴 노출
- [ ] 드롭다운 메뉴 동작
- [ ] Sticky 헤더 (옵션)

**컨텐츠:**
- [ ] 상품 그리드 3-4열 표시
- [ ] 사이드바 + 메인 영역 고정
- [ ] 최대 너비 제한 (max-width: 1280px 권장)

**호버 효과:**
- [ ] 버튼 호버 스타일
- [ ] 상품 카드 호버 효과
- [ ] 링크 호버 언더라인

**코드 예시:**
```css
@media (min-width: 1024px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
  }

  .product-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
  }

  .sidebar {
    position: sticky;
    top: 80px;
    height: fit-content;
  }
}
```

---

## 3. 터치 인터랙션 테스트

### 3.1 기본 터치 이벤트

#### 탭 (Tap) 테스트

**테스트 항목:**
- [ ] 버튼 탭 시 즉시 반응
- [ ] 링크 탭 시 페이지 이동
- [ ] 이미지 탭 시 확대 또는 상세보기
- [ ] 드롭다운 탭 시 메뉴 오픈

**주의사항:**
- 300ms 탭 딜레이 제거 확인
- 더블탭 줌 비활성화 (상품 상세 제외)

**코드 예시:**
```css
/* 탭 딜레이 제거 */
* {
  touch-action: manipulation;
}

/* 터치 영역 확대 */
.button {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 24px;
}
```

#### 롱프레스 (Long Press) 테스트

**테스트 항목:**
- [ ] 상품 이미지 롱프레스 시 컨텍스트 메뉴 억제
- [ ] 텍스트 롱프레스 시 선택 가능
- [ ] 특정 요소 롱프레스 시 툴팁 표시

**구현 예시:**
```javascript
let pressTimer;

element.addEventListener('touchstart', (e) => {
  pressTimer = setTimeout(() => {
    // 롱프레스 동작
    showTooltip();
  }, 500);
});

element.addEventListener('touchend', () => {
  clearTimeout(pressTimer);
});
```

---

### 3.2 스와이프 (Swipe) 제스처

#### 수평 스와이프

**테스트 시나리오:**
- [ ] 이미지 갤러리 좌우 스와이프
- [ ] 카드 스와이프 (Tinder 스타일)
- [ ] 드로어 메뉴 스와이프로 열기/닫기

**주의사항:**
- iOS Safari 뒤로가기 제스처와 충돌 방지
- 스와이프 임계값 설정 (최소 30-50px)

**구현 예시:**
```javascript
let startX = 0;
let endX = 0;

element.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
});

element.addEventListener('touchmove', (e) => {
  endX = e.touches[0].clientX;
});

element.addEventListener('touchend', () => {
  const diff = startX - endX;

  if (Math.abs(diff) > 50) {
    if (diff > 0) {
      // 왼쪽 스와이프
      nextSlide();
    } else {
      // 오른쪽 스와이프
      prevSlide();
    }
  }
});
```

#### 수직 스와이프

**테스트 시나리오:**
- [ ] Pull-to-Refresh (아래로 당기기)
- [ ] 모달 닫기 (아래로 스와이프)
- [ ] 무한 스크롤

**주의사항:**
- 페이지 스크롤과 구분
- 오버스크롤 바운스 효과 처리

---

### 3.3 핀치 줌 (Pinch Zoom)

**테스트 항목:**
- [ ] 상품 이미지 핀치 줌 가능
- [ ] 이미지 갤러리 핀치 줌
- [ ] 페이지 전체 줌 비활성화 (viewport 설정)

**Viewport 설정:**
```html
<!-- 페이지 줌 비활성화 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- 이미지만 줌 허용 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

**이미지 줌 구현:**
```javascript
// Pinch Zoom 라이브러리 사용 권장
// 예: pinch-zoom-js, react-zoom-pan-pinch
import PinchZoom from 'pinch-zoom-js';

const imageElement = document.querySelector('.zoomable-image');
new PinchZoom(imageElement, {
  minZoom: 1,
  maxZoom: 4
});
```

---

### 3.4 스크롤 인터랙션

**테스트 항목:**
- [ ] 부드러운 스크롤 (-webkit-overflow-scrolling)
- [ ] 무한 스크롤 성능
- [ ] Sticky 헤더 동작
- [ ] 상단으로 스크롤 버튼

**iOS 부드러운 스크롤:**
```css
.scrollable-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* iOS 모멘텀 스크롤 */
}
```

**무한 스크롤 성능 최적화:**
```javascript
// Intersection Observer 사용
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMoreProducts();
  }
}, {
  rootMargin: '100px' // 미리 로딩
});

observer.observe(document.querySelector('.load-more-trigger'));
```

---

## 4. 성능 측정 방법

### 4.1 Chrome DevTools Lighthouse

**실행 방법:**
1. Chrome DevTools 열기 (`F12`)
2. "Lighthouse" 탭 선택
3. "Mobile" 선택
4. "Performance" 체크
5. "Analyze page load" 클릭

**주요 지표:**
- **FCP (First Contentful Paint)**: < 1.8초 (목표)
- **LCP (Largest Contentful Paint)**: < 2.5초 (목표)
- **TBT (Total Blocking Time)**: < 200ms (목표)
- **CLS (Cumulative Layout Shift)**: < 0.1 (목표)
- **Speed Index**: < 3.4초 (목표)

**개선 팁:**
```javascript
// 이미지 최적화
<img
  src="image.jpg"
  loading="lazy"
  width="300"
  height="200"
  alt="상품 이미지"
/>

// 폰트 최적화
<link
  rel="preload"
  href="/fonts/main.woff2"
  as="font"
  type="font/woff2"
  crossOrigin="anonymous"
/>
```

---

### 4.2 WebPageTest

**사용법:**
1. https://www.webpagetest.org 접속
2. URL 입력
3. "Test Location" 선택 (Seoul, South Korea)
4. "Mobile" 디바이스 선택
5. "Connection" 선택 (4G, 3G 등)
6. "Start Test" 클릭

**분석 지표:**
- Load Time
- First Byte Time
- Start Render
- Speed Index
- Fully Loaded

**비교 테스트:**
- 경쟁사 사이트와 비교
- 최적화 전후 비교

---

### 4.3 네트워크 속도 시뮬레이션

#### Chrome DevTools Network Throttling

**설정 방법:**
1. Chrome DevTools > Network 탭
2. "No throttling" 드롭다운 선택
3. "Slow 3G", "Fast 3G" 등 선택

**커스텀 프로필 생성:**
```
- Download: 400 Kbps
- Upload: 200 Kbps
- Latency: 400ms
```

**테스트 시나리오:**
- [ ] Slow 3G에서 페이지 로딩 시간
- [ ] 이미지 지연 로딩 동작
- [ ] 스켈레톤 UI 표시
- [ ] 타임아웃 처리

---

### 4.4 실제 디바이스 성능 측정

#### Android - Chrome DevTools

**절차:**
1. Android 디바이스 연결
2. Chrome에서 `chrome://inspect` 접속
3. "inspect" 클릭
4. DevTools > Performance 탭
5. 녹화 시작 후 페이지 인터랙션
6. 녹화 중지 후 분석

**확인 사항:**
- Frame Rate (60fps 목표)
- CPU 사용률
- 메모리 사용량
- 네트워크 요청

#### iOS - Safari Web Inspector

**절차:**
1. iPhone을 Mac에 연결
2. Safari > 개발 > [iPhone] > [페이지]
3. Timelines 탭 선택
4. 녹화 시작

**확인 사항:**
- Layout & Rendering
- JavaScript 실행 시간
- Network 요청

---

### 4.5 성능 최적화 체크리스트

#### 이미지 최적화
- [ ] WebP 포맷 사용
- [ ] 반응형 이미지 (`srcset`)
- [ ] Lazy Loading
- [ ] 압축 (TinyPNG, ImageOptim)
- [ ] CDN 사용

```html
<picture>
  <source
    srcset="image-small.webp 400w, image-medium.webp 800w, image-large.webp 1200w"
    type="image/webp"
  />
  <img
    src="image.jpg"
    alt="상품 이미지"
    loading="lazy"
  />
</picture>
```

#### JavaScript 최적화
- [ ] 코드 스플리팅
- [ ] Tree Shaking
- [ ] Minification
- [ ] 번들 사이즈 분석 (webpack-bundle-analyzer)

```javascript
// Next.js 동적 임포트
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});
```

#### CSS 최적화
- [ ] Critical CSS 인라인
- [ ] CSS Minification
- [ ] Unused CSS 제거 (PurgeCSS)
- [ ] CSS-in-JS 런타임 비용 고려

#### 캐싱 전략
- [ ] Service Worker 캐싱
- [ ] HTTP 캐시 헤더 설정
- [ ] CDN 캐싱
- [ ] Browser 캐싱

```javascript
// Service Worker 예시
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 5. 테스트 자동화

### 5.1 Playwright Mobile Testing

```javascript
// playwright.config.js
import { devices } from '@playwright/test';

export default {
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
};

// mobile.spec.js
import { test, expect } from '@playwright/test';

test('모바일 상품 목록 테스트', async ({ page }) => {
  await page.goto('http://localhost:3000/products');

  // 햄버거 메뉴 확인
  await expect(page.locator('.hamburger-menu')).toBeVisible();

  // 상품 그리드 1열 확인
  const productGrid = page.locator('.product-grid');
  const columns = await productGrid.evaluate((el) => {
    return window.getComputedStyle(el).gridTemplateColumns.split(' ').length;
  });
  expect(columns).toBe(1);
});
```

---

## 6. 모바일 테스트 체크리스트 요약

### 필수 테스트 항목
- [ ] 모든 주요 페이지 모바일 렌더링 확인
- [ ] 터치 가능 요소 최소 크기 44x44px
- [ ] 폼 입력 시 키보드 높이 대응
- [ ] iOS Safe Area 처리
- [ ] Android 뒤로가기 버튼 대응
- [ ] Lighthouse Mobile 점수 90점 이상
- [ ] 3G 네트워크에서 5초 이내 로딩
- [ ] 스크롤 성능 60fps 유지
- [ ] 이미지 Lazy Loading 동작
- [ ] 오프라인 대체 UI 표시

### 우선순위
1. **Critical**: 터치 인터랙션, 폼 입력, 결제 플로우
2. **High**: 페이지 로딩 속도, 이미지 최적화
3. **Medium**: 애니메이션, 호버 효과 대체
4. **Low**: 미세한 UI 조정

---

## 참고 자료

- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Google Web.dev Mobile Testing](https://web.dev/mobile/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)
- [WebPageTest Documentation](https://docs.webpagetest.org/)
- [Playwright Device Emulation](https://playwright.dev/docs/emulation)
