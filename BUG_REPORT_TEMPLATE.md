# 버그 리포트 템플릿

---

## 버그 정보

### 제목
> 간결하고 명확한 한 줄 요약 (예: "모바일에서 결제 버튼 클릭 불가")

**[제목을 여기에 작성]**

---

### 우선순위 / 심각도

- [ ] **Critical** - 서비스 중단, 결제 불가, 데이터 손실
- [ ] **High** - 주요 기능 동작 불가, 다수 사용자 영향
- [ ] **Medium** - 일부 기능 오작동, 워크어라운드 가능
- [ ] **Low** - UI 미세 오류, 특정 환경에서만 발생

**영향 받는 사용자 수:** (예: 전체 / 모바일 사용자 / 특정 브라우저)

---

### 버그 분류

- [ ] Backend API
- [ ] Frontend UI/UX
- [ ] Database
- [ ] Authentication/Authorization
- [ ] Payment
- [ ] Performance
- [ ] Mobile Responsive
- [ ] Browser Compatibility
- [ ] Security
- [ ] Other: ___________

---

## 환경 정보

### 디바이스/브라우저 정보

**운영체제:**
- [ ] Windows (버전: _______)
- [ ] macOS (버전: _______)
- [ ] iOS (버전: _______)
- [ ] Android (버전: _______)
- [ ] Other: ___________

**브라우저:**
- [ ] Chrome (버전: _______)
- [ ] Firefox (버전: _______)
- [ ] Safari (버전: _______)
- [ ] Edge (버전: _______)
- [ ] Mobile Safari (iOS 버전: _______)
- [ ] Chrome Mobile (Android 버전: _______)
- [ ] Other: ___________

**화면 크기:**
- [ ] Mobile (< 640px) - 구체적 크기: _____
- [ ] Tablet (640-1024px) - 구체적 크기: _____
- [ ] Desktop (> 1024px) - 구체적 크기: _____

**네트워크 환경:**
- [ ] WiFi
- [ ] 4G/LTE
- [ ] 3G
- [ ] Slow Connection

---

### 애플리케이션 환경

**환경:**
- [ ] Production (www.example.com)
- [ ] Staging (staging.example.com)
- [ ] Development (localhost)

**버전 정보:**
- Frontend 버전: _____
- Backend 버전: _____
- Git Commit Hash: _____

**사용자 상태:**
- [ ] Logged In (User Role: _____)
- [ ] Logged Out
- [ ] First Time User

---

## 버그 설명

### 현재 동작 (실제 결과)
> 현재 어떤 문제가 발생하고 있는지 구체적으로 설명

**[여기에 작성]**

예시:
```
모바일 Safari에서 상품 상세 페이지의 "예약하기" 버튼을 탭하면
아무런 반응이 없고, 예약 모달이 열리지 않습니다.
```

---

### 예상 동작 (기대 결과)
> 정상적으로 동작한다면 어떻게 되어야 하는지 설명

**[여기에 작성]**

예시:
```
"예약하기" 버튼을 탭하면 예약 날짜 선택 모달이
즉시 열리고 날짜를 선택할 수 있어야 합니다.
```

---

## 재현 단계

### 재현 가능 여부
- [ ] 항상 재현됨 (100%)
- [ ] 자주 재현됨 (70-90%)
- [ ] 가끔 재현됨 (30-70%)
- [ ] 드물게 재현됨 (< 30%)
- [ ] 재현 불가 (한 번만 발생)

### 재현 단계

1. **[단계 1을 여기에 작성]**
   - 예시: "로그인 없이 홈페이지(www.example.com)에 접속"

2. **[단계 2를 여기에 작성]**
   - 예시: "상단 검색창에 '조명' 검색"

3. **[단계 3를 여기에 작성]**
   - 예시: "검색 결과에서 첫 번째 상품 클릭"

4. **[단계 4를 여기에 작성]**
   - 예시: "상품 상세 페이지 하단의 '예약하기' 버튼 탭"

5. **[결과]**
   - 예시: "아무 반응 없음, 모달 열리지 않음"

---

### 재현을 위한 테스트 데이터

**필요한 테스트 계정:**
```
이메일: test@example.com
비밀번호: Test1234!@
```

**테스트 상품 ID:** (있다면)
```
Product ID: 123
Product Name: LED 조명 세트
```

**기타 필요 정보:**
```
[여기에 작성]
```

---

## 스크린샷 및 첨부자료

### 스크린샷 가이드
1. **전체 화면** 캡처 (브라우저 주소창 포함)
2. **개발자 도구** 콘솔 에러 캡처 (있다면)
3. **네트워크 탭** 실패한 요청 캡처 (있다면)
4. **모바일 디바이스** 실제 화면 사진 (해당 시)

### 첨부 파일
> 스크린샷, 비디오, 로그 파일 등을 첨부해주세요

- [ ] 스크린샷 첨부
- [ ] 화면 녹화 첨부 (Loom, CloudApp 등)
- [ ] 콘솔 로그 첨부
- [ ] 네트워크 요청/응답 첨부
- [ ] HAR 파일 첨부 (Chrome DevTools > Network > Export HAR)

**파일 첨부 영역:**
```
[스크린샷을 여기에 드래그 또는 링크 첨부]
```

---

## 기술적 세부사항

### 콘솔 에러 메시지

**브라우저 콘솔 에러:**
```javascript
// F12 > Console 탭의 에러 메시지 복사/붙여넣기
// 예시:
Uncaught TypeError: Cannot read property 'openModal' of undefined
    at handleBookingClick (ProductDetail.tsx:45)
    at onClick (Button.tsx:12)
```

**백엔드 로그 에러:** (해당 시)
```
// 서버 로그 복사/붙여넣기
[2026-01-02 10:30:45] ERROR: Database connection failed
```

---

### 네트워크 요청 정보

**실패한 API 요청:**
```
Request URL: https://api.example.com/api/rentals
Request Method: POST
Status Code: 500 Internal Server Error

Request Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Request Payload:
{
  "productId": 123,
  "startDate": "2026-01-10",
  "endDate": "2026-01-12",
  "quantity": 1
}

Response:
{
  "error": "Internal Server Error",
  "message": "Failed to create rental"
}
```

---

### 관련 코드 (선택사항)

**의심되는 파일/코드 라인:**
```
파일: frontend/app/products/[id]/page.tsx
라인: 45-52

코드:
const handleBookingClick = () => {
  modalRef.current.openModal(); // TypeError 발생
};
```

---

## 추가 정보

### 워크어라운드 (임시 해결책)

있다면 적어주세요:
```
[여기에 작성]

예시:
- 데스크탑 버전으로 전환하면 정상 작동합니다
- 페이지 새로고침 후 다시 시도하면 성공합니다
```

---

### 최초 발견 일시
```
날짜: 2026-01-02
시간: 10:30 AM (KST)
```

---

### 관련 이슈/PR

**연관된 GitHub Issue:**
- #123
- #456

**연관된 Pull Request:**
- #789

---

### 비즈니스 영향도

**사용자 영향:**
```
[여기에 작성]

예시:
- 모바일 사용자의 약 60%가 영향을 받습니다
- 일일 예약 건수가 30% 감소했습니다
- 고객 문의가 10건 이상 접수되었습니다
```

**매출 영향:**
```
[해당 시 작성]

예시:
- 예상 매출 손실: 하루 약 100만원
- 주요 프로모션 기간과 겹쳐 영향 큽니다
```

---

## 제안 사항

### 예상 원인
```
[여기에 작성]

예시:
- 모바일 Safari에서 modalRef가 undefined로 초기화되는 것으로 추정
- React 18의 Strict Mode와 관련 있을 수 있음
```

### 제안 해결책
```
[여기에 작성]

예시:
- modalRef 초기화 로직 수정
- null check 추가: modalRef.current?.openModal()
- useEffect에서 모달 초기화 보장
```

---

## 담당자 정보

**리포터:**
- 이름: _____
- 이메일: _____
- 역할: QA / Developer / PM / User

**할당된 담당자:**
- 이름: _____
- 이메일: _____

**리뷰어:**
- 이름: _____

---

## 상태 추적

- [ ] **Reported** - 버그 리포트 작성 완료
- [ ] **Confirmed** - 개발팀 확인 완료
- [ ] **In Progress** - 수정 작업 진행 중
- [ ] **Fixed** - 수정 완료 (Dev/Staging)
- [ ] **Verified** - QA 재테스트 통과
- [ ] **Deployed** - 프로덕션 배포 완료
- [ ] **Closed** - 이슈 완전 종료

**마지막 업데이트:** 2026-01-02

---

## 커뮤니케이션 로그

### 업데이트 내역

**2026-01-02 10:30 - 버그 리포트 작성**
- 최초 발견 및 리포트 작성

**2026-01-02 14:00 - 개발팀 확인**
- @developer: 확인 완료, modalRef 초기화 이슈 맞음

**2026-01-03 09:00 - 수정 완료**
- PR #790 생성, Staging 배포 완료

**2026-01-03 15:00 - QA 재테스트**
- Staging 환경에서 재테스트 통과

**2026-01-04 10:00 - 프로덕션 배포**
- 프로덕션 배포 완료, 모니터링 중

---

## 체크리스트

재출시 전 다음 항목을 확인하세요:

- [ ] 버그 제목이 명확하고 구체적인가?
- [ ] 우선순위/심각도가 정확한가?
- [ ] 재현 단계가 명확하고 순서대로 작성되었는가?
- [ ] 스크린샷 또는 비디오가 첨부되었는가?
- [ ] 콘솔 에러 메시지가 포함되었는가?
- [ ] 환경 정보(OS, 브라우저, 버전)가 명시되었는가?
- [ ] 예상 동작과 실제 동작이 구분되어 설명되었는가?
- [ ] 담당자가 할당되었는가?

---

## 템플릿 사용 예시

다음은 실제 버그 리포트 예시입니다:

---

### 예시 1: Critical Bug

**제목:** 결제 완료 후 500 에러 발생, 예약 미생성

**우선순위:** Critical

**환경:**
- OS: Windows 11
- Browser: Chrome 120
- Environment: Production

**현재 동작:**
결제는 성공했으나 백엔드에서 500 에러가 발생하여 예약이 생성되지 않음.
사용자는 결제만 되고 예약 확인서를 받지 못함.

**예상 동작:**
결제 완료 후 예약이 정상 생성되고 예약 확인 이메일이 발송되어야 함.

**재현 단계:**
1. 상품 선택 후 예약 정보 입력
2. 결제 페이지에서 카드 정보 입력
3. 결제 완료 버튼 클릭
4. 결제 성공 응답 받음
5. 백엔드에서 500 에러 발생
6. 예약 미생성, 사용자는 결제만 완료 상태

**콘솔 에러:**
```
POST /api/rentals/confirm 500
Error: Cannot read property 'id' of undefined
    at RentalService.createRental (rental.service.ts:123)
```

**비즈니스 영향:**
- 하루 5-10건 발생
- 고객 문의 폭주
- 수동 환불 처리 필요

---

### 예시 2: UI Bug

**제목:** 모바일에서 예약 날짜 선택 캘린더 잘림

**우선순위:** Medium

**환경:**
- OS: iOS 16
- Browser: Mobile Safari
- Screen: iPhone 13 (390x844)

**현재 동작:**
캘린더가 화면 밖으로 잘려서 하단 날짜 선택 불가

**예상 동작:**
캘린더가 화면 안에 모두 표시되어야 함

**재현 단계:**
1. iPhone Safari에서 상품 상세 페이지 접속
2. "예약하기" 버튼 탭
3. 날짜 선택 캘린더 오픈
4. 하단 날짜가 화면 밖으로 잘림

**스크린샷:**
[첨부]

---

이 템플릿을 사용하여 버그를 명확하게 문서화하고 빠른 해결을 돕습니다.
