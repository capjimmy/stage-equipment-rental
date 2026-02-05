# 🎭 Stage Equipment Rental Platform

공연/무대용품 멀티벤더 렌탈 플랫폼 MVP

## 📋 프로젝트 개요

날짜 선택 기반 검색과 해시태그 태깅을 활용한 공연 무대용품 렌탈 이커머스 플랫폼입니다.

## 🚀 빠른 시작

### 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```
브라우저에서 http://localhost:3000 접속

### 백엔드 실행
```bash
cd backend
npm install
npm run start:dev
```
서버 실행 후 http://localhost:3001/api 접속

### 데이터베이스 시드 (최초 1회)
```bash
cd backend
npx ts-node src/seed.ts
```

**테스트 계정:**
- 관리자: admin@example.com / password123
- 공급자1: supplier1@example.com / password123
- 공급자2: supplier2@example.com / password123
- 고객: customer@example.com / password123

## ✅ 완성된 기능

### 프론트엔드
- ✅ **트렌디한 메인 페이지** (보라색-핑크 그라디언트)
  - 날짜 우선 선택 UI
  - 인기 태그 표시
  - 카테고리별 탐색 (의상/소품/무대장치/장비)
  - 추천 연출 세트

- ✅ **검색 결과 페이지**
  - 고급 필터 (카테고리, 상태, 대여 가능 여부)
  - 상품 카드 그리드
  - 대여 가능/불가 상품 구분
  - 실시간 재고 표시

### 백엔드
- ✅ **완전한 데이터베이스 스키마** (13개 엔티티)
  - User, Product, Asset, Order, Rental
  - Payment, Settlement, Category, Tag
  - Cart, CartItem, RentalIssue, Notification

- ✅ **인증 시스템** (JWT + RBAC)
  - 회원가입/로그인 API
  - JWT 토큰 기반 인증
  - 역할별 권한 관리 (Customer/Supplier/Admin)

- ✅ **상품 API**
  - 날짜 기반 검색
  - 태그 검색
  - 실시간 재고 계산

- ✅ **데이터베이스**
  - SQLite 기반 (better-sqlite3)
  - 시드 데이터 자동 생성
  - 4개 상품 + 28개 자산 샘플 데이터

## 🏗️ 기술 스택

### Frontend
- Next.js 15 + TypeScript + Tailwind CSS
- Zustand + React Query
- Lucide React (아이콘)

### Backend
- NestJS + TypeScript
- TypeORM + PostgreSQL/SQLite
- JWT + Passport

## 📊 핵심 비즈니스 로직

### 1. 날짜 우선 검색
- 검색 전 대여 기간 필수 선택
- 선택된 날짜에 대여 가능한 상품만 노출
- "대여 불가 상품도 표시" 옵션 지원

### 2. 실물 자산 관리
- **Product**: 상품 정보 (카탈로그)
- **Asset**: 실제 대여 가능한 실물 (예: A-001, A-002)
- 각 Asset별 독립적인 일정 관리

### 3. 예약 충돌 방지
- buffer_days = 1 (검수/세탁 시간)
- blocked_end = end_date + 1
- 같은 Asset의 blocked 기간 겹침 방지

### 4. 계좌이체 승인형 결제 (2단계)
```
REQUESTED
  → HOLD_PENDINGPAY (1차 승인, Asset 배정)
  → CONFIRMED (2차 승인, 입금 확인)
```
- 입금 기한: 24시간 고정
- 기한 초과 시 자동 EXPIRED

### 5. 취소/환불 정책
- 입금 후 2시간: 100% 환불 (쿨링오프)
- 대여 21일 이전: 100% 환불
- 대여 14-20일 전: 50% 환불
- 대여 7-13일 전: 20% 환불
- 대여 0-6일 전: 10% 환불

### 6. 정산
- 기본 렌탈료: 50:50 (플랫폼:공급자)
- 파손/연체 추가 청구: 공급자 100%

## 📁 주요 파일

```
frontend/
├── app/page.tsx              # 메인 페이지
├── app/search/page.tsx       # 검색 페이지
└── app/globals.css           # 디자인 시스템

backend/
├── src/entities/             # 13개 엔티티
├── src/auth/                 # 인증 모듈
└── src/products/             # 상품 API
```

## 🎨 디자인 하이라이트

- **트렌디한 컬러**: Violet-500 + Pink-500 그라디언트
- **반응형 디자인**: Mobile-first approach
- **애니메이션**: Smooth transitions & hover effects
- **일관된 컴포넌트**: btn, card, tag, input 클래스

## 🚧 추가 개발 필요

- [ ] 장바구니 기능 완성
- [ ] 주문/결제 플로우
- [ ] 관리자 대시보드
- [ ] 공급자 대시보드
- [ ] 배치 작업 (자동 만료, 정산)
- [ ] 알림 시스템
- [ ] 프론트엔드-백엔드 실제 연동

## 📝 개발 로그

- 2025-12-28: 프로젝트 초기 구조 완성
  - 프론트엔드 메인 + 검색 페이지
  - 백엔드 데이터베이스 스키마
  - 인증 시스템
  - 상품 검색 API

- 2025-12-29: 백엔드 완전 작동
  - SQLite enum/timestamp 호환성 문제 해결
  - 백엔드 서버 정상 실행 (localhost:3001/api)
  - 시드 데이터 생성 완료
  - API 테스트 통과 (검색, 인증 등)

---

**개발 상태**: 백엔드 완료, 프론트엔드-백엔드 연동 진행 중
**다음 단계**: 프론트엔드에서 실제 API 호출하여 데이터 표시
