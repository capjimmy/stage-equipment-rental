# -*- coding: utf-8 -*-
import sqlite3
import json

DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 이미지가 있는 상품 조회
cursor.execute("SELECT id, title, images FROM products WHERE images IS NOT NULL AND images != 'null'")
products = cursor.fetchall()

print(f"Total products with images: {len(products)}")

# 샘플 확인
for i, product in enumerate(products[:5]):
    product_id, title, images = product
    print(f"\n[{i+1}] {title[:30]}...")
    print(f"  Raw: {images[:100]}...")

    # 파싱 테스트
    try:
        parsed = json.loads(images)
        print(f"  Parsed type: {type(parsed)}")
        if isinstance(parsed, list) and len(parsed) > 0:
            print(f"  First element type: {type(parsed[0])}")
            print(f"  First element: {str(parsed[0])[:80]}...")
    except Exception as e:
        print(f"  Parse error: {e}")

conn.close()
