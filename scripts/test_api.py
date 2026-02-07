import requests
import json

# API 호출
response = requests.get("http://localhost:3001/api/products?limit=20")
products = response.json()

# 배열인 경우 처리
if isinstance(products, list):
    data = products
else:
    data = products.get('products', products.get('data', []))

print(f"총 반환된 상품: {len(data)}개")
print("\n이미지가 있는 상품:")
count = 0
for p in data:
    images = p.get('images')
    if images and len(str(images)) > 5:
        count += 1
        print(f"  - {p['title'][:50]}")
        print(f"    이미지: {str(images)[:80]}...")
        if count >= 5:
            break

print(f"\n이미지 있는 상품: {count}개")

# 새로 추가된 상품 (바람사, 나폴레옹 등)
print("\n새로 추가된 뮤지컬 상품 검색:")
for musical in ['바람사', '나폴레옹', '오캐롤', '에드거']:
    found = [p for p in data if musical in p.get('title', '')]
    print(f"  {musical}: {len(found)}개")
