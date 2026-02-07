# -*- coding: utf-8 -*-
import sqlite3
import json

DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 이미지가 있는 상품 조회
cursor.execute("SELECT id, title, images FROM products WHERE images IS NOT NULL AND images != 'null'")
products = cursor.fetchall()

print(f"이미지가 있는 상품: {len(products)}개")

fixed_count = 0
for product in products:
    product_id, title, images = product

    if images and images.startswith('["[\\"'):
        # 이중 인코딩된 경우 수정
        try:
            # 먼저 외부 JSON 파싱
            parsed = json.loads(images)
            if isinstance(parsed, list) and len(parsed) > 0:
                inner = parsed[0]
                if isinstance(inner, str) and inner.startswith('['):
                    # 내부 JSON 파싱
                    inner_parsed = json.loads(inner)
                    # 올바른 형식으로 저장
                    fixed_images = json.dumps(inner_parsed)
                    cursor.execute(
                        "UPDATE products SET images = ? WHERE id = ?",
                        (fixed_images, product_id)
                    )
                    fixed_count += 1
                    print(f"  Fixed: {title[:40]}...")
        except Exception as e:
            print(f"  Error fixing {title}: {e}")

conn.commit()
conn.close()

print(f"\n{fixed_count}개 상품 이미지 URL 수정 완료")
