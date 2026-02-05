-- 일정 시스템 테스트를 위한 대여 데이터 생성
-- 실행 방법: psql -U postgres -d stage_rental -f test-rental-data.sql

-- 1. 첫 번째 상품의 ID와 자산 ID 확인
DO $$
DECLARE
    v_product_id uuid;
    v_asset_id uuid;
    v_user_id uuid;
    v_order_id uuid;
    v_rental_id uuid;
    v_start_date date;
    v_end_date date;
    v_blocked_end date;
BEGIN
    -- 첫 번째 상품 선택
    SELECT id INTO v_product_id FROM products LIMIT 1;
    RAISE NOTICE '선택된 상품 ID: %', v_product_id;

    -- 해당 상품의 첫 번째 자산 선택
    SELECT id INTO v_asset_id FROM assets WHERE "productId" = v_product_id LIMIT 1;
    RAISE NOTICE '선택된 자산 ID: %', v_asset_id;

    -- 첫 번째 사용자 선택
    SELECT id INTO v_user_id FROM users LIMIT 1;
    RAISE NOTICE '선택된 사용자 ID: %', v_user_id;

    -- 대여 기간 설정 (오늘부터 5일간)
    v_start_date := CURRENT_DATE;
    v_end_date := CURRENT_DATE + INTERVAL '4 days';
    v_blocked_end := v_end_date + INTERVAL '1 day'; -- 버퍼 1일

    RAISE NOTICE '대여 시작일: %', v_start_date;
    RAISE NOTICE '대여 종료일: %', v_end_date;
    RAISE NOTICE '차단 종료일: %', v_blocked_end;

    -- 주문 생성
    INSERT INTO orders (
        "userId",
        "startDate",
        "endDate",
        "totalAmount",
        "paymentMethod",
        "paymentStatus",
        "fulfillmentStatus",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_user_id,
        v_start_date,
        v_end_date,
        150000, -- 30000원/일 * 5일
        'bank_transfer',
        'pending',
        'confirmed',
        NOW(),
        NOW()
    ) RETURNING id INTO v_order_id;

    RAISE NOTICE '주문 생성 완료 ID: %', v_order_id;

    -- 대여 생성
    INSERT INTO rentals (
        "orderId",
        "assetId",
        "startDate",
        "endDate",
        "bufferDays",
        "blockedStart",
        "blockedEnd",
        "status",
        "createdAt",
        "updatedAt"
    ) VALUES (
        v_order_id,
        v_asset_id,
        v_start_date,
        v_end_date,
        1,
        v_start_date,
        v_blocked_end,
        'confirmed',
        NOW(),
        NOW()
    ) RETURNING id INTO v_rental_id;

    RAISE NOTICE '대여 생성 완료 ID: %', v_rental_id;
    RAISE NOTICE '✅ 테스트 데이터 생성 완료!';

END $$;

-- 생성된 대여 확인
SELECT
    r.id,
    r."blockedStart",
    r."blockedEnd",
    r.status,
    a."assetCode",
    p.title as product_title
FROM rentals r
JOIN assets a ON r."assetId" = a.id
JOIN products p ON a."productId" = p.id
WHERE r."blockedEnd" >= CURRENT_DATE
ORDER BY r."blockedStart" DESC
LIMIT 5;
