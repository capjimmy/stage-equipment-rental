#!/bin/bash

# 공연무대용품 렌탈 플랫폼 통합 테스트 스크립트
# 사용법: ./test-suite.sh [option]
# Options: all, backend, frontend, api, db

set -e  # 에러 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 환경 변수
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
DB_PATH="${DB_PATH:-./backend/stage_rental.db}"

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 구분선 출력
print_separator() {
    echo "=================================================="
}

# 1. 백엔드 헬스체크
test_backend_health() {
    print_separator
    log_info "백엔드 헬스체크 시작..."

    # 백엔드 서버 실행 확인
    if ! curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
        log_warning "백엔드 서버가 실행되지 않았습니다. 서버를 시작합니다..."
        cd backend
        npm run start:dev &
        BACKEND_PID=$!
        sleep 10
        cd ..
    fi

    # Health Check API 테스트
    log_info "Health Check API 테스트 중..."
    HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health")

    if [ "$HEALTH_STATUS" -eq 200 ]; then
        log_success "백엔드 서버 정상 작동 중 (HTTP $HEALTH_STATUS)"
    else
        log_error "백엔드 서버 응답 없음 (HTTP $HEALTH_STATUS)"
        return 1
    fi

    # 데이터베이스 연결 확인
    log_info "데이터베이스 연결 확인 중..."
    if [ -f "$DB_PATH" ]; then
        log_success "데이터베이스 파일 존재: $DB_PATH"
    else
        log_error "데이터베이스 파일 없음: $DB_PATH"
        return 1
    fi

    print_separator
}

# 2. 프론트엔드 빌드 테스트
test_frontend_build() {
    print_separator
    log_info "프론트엔드 빌드 테스트 시작..."

    cd frontend

    # 의존성 확인
    log_info "의존성 패키지 확인 중..."
    if [ ! -d "node_modules" ]; then
        log_warning "node_modules가 없습니다. npm install 실행 중..."
        npm install
    fi

    # TypeScript 타입 체크
    log_info "TypeScript 타입 체크 중..."
    if npx tsc --noEmit; then
        log_success "TypeScript 타입 체크 통과"
    else
        log_error "TypeScript 타입 에러 발견"
        cd ..
        return 1
    fi

    # Linting
    log_info "ESLint 검사 중..."
    if npm run lint; then
        log_success "ESLint 검사 통과"
    else
        log_warning "ESLint 경고 발견"
    fi

    # 프로덕션 빌드
    log_info "프로덕션 빌드 시작..."
    if npm run build; then
        log_success "프론트엔드 빌드 성공"
    else
        log_error "프론트엔드 빌드 실패"
        cd ..
        return 1
    fi

    cd ..
    print_separator
}

# 3. API 엔드포인트 테스트
test_api_endpoints() {
    print_separator
    log_info "API 엔드포인트 테스트 시작..."

    # 테스트용 변수
    TEST_EMAIL="test_$(date +%s)@example.com"
    TEST_PASSWORD="Test1234!@"
    AUTH_TOKEN=""

    # 3.1 회원가입 테스트
    log_info "회원가입 API 테스트..."
    SIGNUP_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/auth/signup" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\",
            \"name\": \"테스트 사용자\",
            \"phone\": \"010-1234-5678\",
            \"role\": \"user\"
        }")

    if echo "$SIGNUP_RESPONSE" | grep -q "\"id\""; then
        log_success "회원가입 성공"
    else
        log_error "회원가입 실패: $SIGNUP_RESPONSE"
    fi

    # 3.2 로그인 테스트
    log_info "로그인 API 테스트..."
    LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"$TEST_PASSWORD\"
        }")

    AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

    if [ -n "$AUTH_TOKEN" ]; then
        log_success "로그인 성공 (토큰: ${AUTH_TOKEN:0:20}...)"
    else
        log_error "로그인 실패: $LOGIN_RESPONSE"
        return 1
    fi

    # 3.3 상품 목록 조회 테스트
    log_info "상품 목록 조회 API 테스트..."
    PRODUCTS_RESPONSE=$(curl -s -X GET "${BACKEND_URL}/api/products")

    if echo "$PRODUCTS_RESPONSE" | grep -q "\"items\""; then
        PRODUCT_COUNT=$(echo "$PRODUCTS_RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
        log_success "상품 목록 조회 성공 (총 $PRODUCT_COUNT개)"
    else
        log_error "상품 목록 조회 실패"
    fi

    # 3.4 상품 상세 조회 테스트
    log_info "상품 상세 조회 API 테스트..."
    PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$PRODUCT_ID" ]; then
        PRODUCT_DETAIL=$(curl -s -X GET "${BACKEND_URL}/api/products/${PRODUCT_ID}")
        if echo "$PRODUCT_DETAIL" | grep -q "\"name\""; then
            log_success "상품 상세 조회 성공"
        else
            log_error "상품 상세 조회 실패"
        fi
    else
        log_warning "테스트할 상품이 없습니다"
    fi

    # 3.5 예약 생성 테스트 (인증 필요)
    log_info "예약 생성 API 테스트..."
    if [ -n "$PRODUCT_ID" ]; then
        RENTAL_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/rentals" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "{
                \"productId\": $PRODUCT_ID,
                \"startDate\": \"$(date -d '+7 days' '+%Y-%m-%d')\",
                \"endDate\": \"$(date -d '+10 days' '+%Y-%m-%d')\",
                \"quantity\": 1
            }")

        if echo "$RENTAL_RESPONSE" | grep -q "\"id\""; then
            log_success "예약 생성 성공"
        else
            log_warning "예약 생성 실패 (재고 부족 또는 기타 이유): $RENTAL_RESPONSE"
        fi
    fi

    # 3.6 마이페이지 조회 테스트
    log_info "사용자 정보 조회 API 테스트..."
    USER_PROFILE=$(curl -s -X GET "${BACKEND_URL}/api/users/me" \
        -H "Authorization: Bearer $AUTH_TOKEN")

    if echo "$USER_PROFILE" | grep -q "\"email\""; then
        log_success "사용자 정보 조회 성공"
    else
        log_error "사용자 정보 조회 실패"
    fi

    print_separator
}

# 4. 데이터베이스 검증
test_database() {
    print_separator
    log_info "데이터베이스 검증 시작..."

    if ! command -v sqlite3 &> /dev/null; then
        log_warning "sqlite3 CLI가 설치되지 않았습니다. 데이터베이스 검증을 건너뜁니다."
        print_separator
        return 0
    fi

    # 테이블 존재 확인
    log_info "데이터베이스 테이블 확인 중..."
    TABLES=$(sqlite3 "$DB_PATH" ".tables")

    REQUIRED_TABLES=("users" "products" "rentals" "reviews" "payments")

    for TABLE in "${REQUIRED_TABLES[@]}"; do
        if echo "$TABLES" | grep -q "$TABLE"; then
            log_success "테이블 '$TABLE' 존재 확인"
        else
            log_error "테이블 '$TABLE' 없음"
        fi
    done

    # 데이터 건수 확인
    log_info "데이터 건수 확인 중..."

    USER_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM users;")
    PRODUCT_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM products;")
    RENTAL_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM rentals;")

    log_info "사용자: $USER_COUNT명"
    log_info "상품: $PRODUCT_COUNT개"
    log_info "예약: $RENTAL_COUNT건"

    # 데이터 무결성 체크
    log_info "데이터 무결성 검사 중..."
    INTEGRITY_CHECK=$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")

    if [ "$INTEGRITY_CHECK" = "ok" ]; then
        log_success "데이터베이스 무결성 정상"
    else
        log_error "데이터베이스 무결성 문제 발견: $INTEGRITY_CHECK"
        return 1
    fi

    print_separator
}

# 5. 통합 테스트 실행
run_integration_tests() {
    print_separator
    log_info "통합 테스트 시작..."

    cd backend

    # Jest 유닛 테스트
    log_info "백엔드 유닛 테스트 실행 중..."
    if npm run test; then
        log_success "백엔드 유닛 테스트 통과"
    else
        log_warning "백엔드 유닛 테스트 실패"
    fi

    # E2E 테스트
    log_info "E2E 테스트 실행 중..."
    if npm run test:e2e; then
        log_success "E2E 테스트 통과"
    else
        log_warning "E2E 테스트 실패"
    fi

    cd ..
    print_separator
}

# 6. 성능 테스트
test_performance() {
    print_separator
    log_info "성능 테스트 시작..."

    if ! command -v ab &> /dev/null; then
        log_warning "Apache Bench (ab)가 설치되지 않았습니다. 성능 테스트를 건너뜁니다."
        print_separator
        return 0
    fi

    # API 응답 시간 테스트 (100개 요청)
    log_info "API 응답 시간 테스트 (100개 요청)..."
    ab -n 100 -c 10 "${BACKEND_URL}/api/products" > /tmp/ab_test.txt 2>&1

    AVG_TIME=$(grep "Time per request" /tmp/ab_test.txt | head -1 | awk '{print $4}')
    REQUESTS_PER_SEC=$(grep "Requests per second" /tmp/ab_test.txt | awk '{print $4}')

    log_info "평균 응답 시간: ${AVG_TIME}ms"
    log_info "초당 요청 처리: ${REQUESTS_PER_SEC} req/sec"

    if (( $(echo "$AVG_TIME < 500" | bc -l) )); then
        log_success "성능 테스트 통과 (목표: < 500ms)"
    else
        log_warning "성능 개선 필요 (현재: ${AVG_TIME}ms, 목표: < 500ms)"
    fi

    print_separator
}

# 테스트 요약
print_summary() {
    print_separator
    log_info "테스트 요약"
    print_separator
    echo "테스트 완료 시간: $(date)"
    echo ""
    echo "다음 단계:"
    echo "1. 발견된 이슈를 GitHub Issues에 등록하세요"
    echo "2. 실패한 테스트는 BUG_REPORT_TEMPLATE.md를 사용하여 문서화하세요"
    echo "3. 프로덕션 배포 전 모든 Critical 테스트가 통과되었는지 확인하세요"
    print_separator
}

# 메인 실행 로직
main() {
    local test_type="${1:-all}"

    echo ""
    log_info "공연무대용품 렌탈 플랫폼 테스트 스위트"
    log_info "테스트 유형: $test_type"
    echo ""

    case "$test_type" in
        "backend")
            test_backend_health
            ;;
        "frontend")
            test_frontend_build
            ;;
        "api")
            test_api_endpoints
            ;;
        "db")
            test_database
            ;;
        "performance")
            test_performance
            ;;
        "all")
            test_backend_health
            test_database
            test_api_endpoints
            test_frontend_build
            test_performance
            ;;
        *)
            log_error "알 수 없는 테스트 유형: $test_type"
            log_info "사용법: ./test-suite.sh [all|backend|frontend|api|db|performance]"
            exit 1
            ;;
    esac

    print_summary
}

# 스크립트 종료 시 정리
cleanup() {
    if [ -n "$BACKEND_PID" ]; then
        log_info "백엔드 서버 종료 중..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
}

trap cleanup EXIT

# 스크립트 실행
main "$@"
