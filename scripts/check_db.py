import sqlite3

conn = sqlite3.connect('c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db')
c = conn.cursor()

# 총 상품 수
c.execute('SELECT COUNT(*) FROM products')
print(f'총 상품: {c.fetchone()[0]}개')

# 이미지 있는 상품
c.execute("SELECT COUNT(*) FROM products WHERE images IS NOT NULL AND images != ''")
print(f'이미지 있는 상품: {c.fetchone()[0]}개')

# 뮤지컬별 상품 수
print('\n뮤지컬별 상품 수:')
c.execute("SELECT CASE WHEN title LIKE '%바람사%' THEN '바람사' WHEN title LIKE '%오캐롤%' THEN '오캐롤' WHEN title LIKE '%나폴레옹%' THEN '나폴레옹' WHEN title LIKE '%에드거%' OR title LIKE '%포%' THEN '에드거앨런포' ELSE '기타' END as musical, COUNT(*) FROM products GROUP BY musical")
for row in c.fetchall():
    print(f'  {row[0]}: {row[1]}개')

# 카테고리별 상품 수
print('\n카테고리별 상품 수:')
c.execute("SELECT c.name, COUNT(p.id) FROM products p LEFT JOIN categories c ON p.categoryId = c.id GROUP BY c.name")
for row in c.fetchall():
    print(f'  {row[0]}: {row[1]}개')

# 최근 생성된 상품 5개
print('\n최근 생성된 상품 5개:')
c.execute('SELECT title, images FROM products ORDER BY createdAt DESC LIMIT 5')
for row in c.fetchall():
    title = row[0][:60] if row[0] else 'N/A'
    img = row[1][:80] if row[1] else 'N/A'
    print(f'  - {title}')
    print(f'    이미지: {img}...')

conn.close()
