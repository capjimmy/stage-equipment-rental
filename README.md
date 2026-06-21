# 🎭 Stage Equipment Rental Platform

공연/무대용품 렌탈 플랫폼. 날짜 기반 검색과 자산(Asset) 단위 예약 관리, 계좌이체 승인형 결제 플로우를 제공합니다.

## 📦 저장소 구조

```
frontend/        ← 실제 서비스 (Next.js 16 + React 19 + Firebase). Vercel 배포 루트.
docs/            기획·사업 문서
source/          상품 데이터 추출용 원본 자료(의상 바이블 등)
*.html, *.txt    로드맵 / 운영정책 / 개발 로그
```

> 과거의 NestJS + SQLite 백엔드와 루트 스타터 앱은 제거되었습니다.
> 백엔드는 전부 **Firebase(Firestore · Storage · Auth)** 로 대체되었습니다.

## 🚀 개발

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
npm run lint
```

Firebase 설정은 `frontend/lib/firebase.ts` 에 있습니다 (클라이언트 공개 키).

## 🏗️ 기술 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 3**
- **Firebase**: Firestore(DB) · Storage(이미지) · Auth(이메일/비밀번호)
- **React Query** (서버 상태) · 장바구니는 localStorage
- 데이터 접근은 `lib/firebaseService.ts` 단일 레이어, `lib/api.ts` 가 import 창구(barrel)

## 📂 주요 디렉터리 (`frontend/`)

```
app/             라우트 (고객 / auth / admin)
  ├─ admin/      관리자: 상품·카테고리·주문·사용자·추천세트
  ├─ auth/       로그인 · 회원가입 (정본 경로)
  ├─ product/, search/, cart/, checkout/, order/, mypage/, featured/
components/      공용 UI (FloatingCart, RentalCalendar, AdminLayout 등)
hooks/           React Query 훅 (useProducts, useOrders, useCart 등)
lib/             firebase.ts · firebaseService.ts · api.ts
types/           도메인 타입 정의
```

## 📊 핵심 도메인 로직

- **자산(Asset) 단위 관리**: Product(카탈로그) ↔ Asset(실물, 고유 코드) — 자산별 예약 불가 기간으로 충돌 방지
- **계좌이체 승인형 결제(2단계)**: `requested → approved(입금대기) → confirmed(입금확인/예약확정)`
- **취소/환불 정책**: 대여일 기준 차등 환불 (운영정책 문서 참고)
- **정산**: 기본 렌탈료 50:50(플랫폼:공급자), 파손/연체 추가분 공급자 100%

## 🔐 Firebase 보안 규칙

`frontend/firestore.rules` · `frontend/storage.rules` 는 저장소에 있지만 **자동 배포되지 않습니다**.
적용하려면:

```bash
cd frontend
firebase deploy --only firestore:rules,storage
```

규칙은 카탈로그 읽기를 인증 사용자에게 허용하고, 쓰기는 소유자/관리자로 제한합니다.
배포 전 Firebase 콘솔 Rules Playground에서 테스트하세요.

## 🚢 배포

Vercel이 `frontend/` 를 루트 디렉터리로 빌드/배포합니다 (`master` push 시 자동).
