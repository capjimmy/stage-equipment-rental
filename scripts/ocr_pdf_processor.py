#!/usr/bin/env python3
"""
OCR 기반 PDF 처리 스크립트
나폴레옹, 오캐롤, 에드거앨런포 뮤지컬 의상 데이터 생성
"""
import fitz  # PyMuPDF
import os
import sqlite3
import uuid
import hashlib
from pathlib import Path
from datetime import datetime

# 경로 설정
BASE_DIR = Path("c:/Users/parkm/stage-equipment-rental")
SOURCE_DIR = BASE_DIR / "source"
UPLOAD_DIR = BASE_DIR / "backend" / "uploads" / "products"
DB_PATH = BASE_DIR / "backend" / "stage_rental.db"

# 업로드 디렉토리 생성
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ===== 나폴레옹 의상 데이터 =====
NAPOLEON_COSTUMES = [
    # 나폴레옹
    {"character": "나폴레옹", "scene": "포병대장 시절", "costume": "포병 군복", "page": 1, "image_index": 0},
    {"character": "나폴레옹", "scene": "장군 취임", "costume": "장군 정복", "page": 1, "image_index": 1},
    {"character": "나폴레옹", "scene": "이탈리아 원정", "costume": "야전 군복", "page": 2, "image_index": 0},
    {"character": "나폴레옹", "scene": "이집트 원정", "costume": "사막 군복", "page": 2, "image_index": 1},
    {"character": "나폴레옹", "scene": "제1통령 취임", "costume": "붉은색 예복", "page": 3, "image_index": 0},
    {"character": "나폴레옹", "scene": "대관식", "costume": "황제 대관복", "page": 3, "image_index": 1},
    {"character": "나폴레옹", "scene": "러시아 원정", "costume": "겨울 군복", "page": 4, "image_index": 0},
    {"character": "나폴레옹", "scene": "엘바섬 유배", "costume": "간소한 정복", "page": 4, "image_index": 1},
    {"character": "나폴레옹", "scene": "백일천하", "costume": "프랑스 군복", "page": 5, "image_index": 0},
    {"character": "나폴레옹", "scene": "세인트헬레나", "costume": "흰색 셔츠", "page": 5, "image_index": 1},

    # 조제핀
    {"character": "조제핀", "scene": "살롱에서의 만남", "costume": "흰색 그리스풍 드레스", "page": 6, "image_index": 0},
    {"character": "조제핀", "scene": "결혼식", "costume": "웨딩 드레스", "page": 6, "image_index": 1},
    {"character": "조제핀", "scene": "퍼스트레이디", "costume": "화려한 궁정 드레스", "page": 7, "image_index": 0},
    {"character": "조제핀", "scene": "대관식", "costume": "황후 대관복", "page": 7, "image_index": 1},
    {"character": "조제핀", "scene": "이혼 장면", "costume": "검은색 드레스", "page": 8, "image_index": 0},
    {"character": "조제핀", "scene": "말메종", "costume": "은퇴 후 드레스", "page": 8, "image_index": 1},

    # 마리 루이즈
    {"character": "마리 루이즈", "scene": "오스트리아 공주", "costume": "오스트리아 궁정복", "page": 9, "image_index": 0},
    {"character": "마리 루이즈", "scene": "결혼식", "costume": "웨딩 드레스", "page": 9, "image_index": 1},
    {"character": "마리 루이즈", "scene": "황후", "costume": "프랑스 황실 드레스", "page": 10, "image_index": 0},

    # 탈리앙 부인
    {"character": "탈리앙 부인", "scene": "살롱 장면", "costume": "화려한 귀족 드레스", "page": 11, "image_index": 0},
    {"character": "탈리앙 부인", "scene": "파티", "costume": "야회복", "page": 11, "image_index": 1},

    # 바라스
    {"character": "바라스", "scene": "총재정부", "costume": "화려한 귀족 정장", "page": 12, "image_index": 0},
    {"character": "바라스", "scene": "권력 상실", "costume": "검소한 정장", "page": 12, "image_index": 1},

    # 폴린
    {"character": "폴린", "scene": "어린 시절", "costume": "소녀 드레스", "page": 13, "image_index": 0},
    {"character": "폴린", "scene": "결혼 후", "costume": "공주 드레스", "page": 13, "image_index": 1},

    # 루시앙
    {"character": "루시앙", "scene": "정치인 시절", "costume": "정치인 정장", "page": 14, "image_index": 0},

    # 레티시아 (어머니)
    {"character": "레티시아", "scene": "코르시카", "costume": "서민 드레스", "page": 15, "image_index": 0},
    {"character": "레티시아", "scene": "황제의 어머니", "costume": "황실 드레스", "page": 15, "image_index": 1},

    # 앙상블
    {"character": "앙상블 남성", "scene": "군인", "costume": "프랑스 군복", "page": 16, "image_index": 0},
    {"character": "앙상블 남성", "scene": "귀족", "costume": "귀족 정장", "page": 17, "image_index": 0},
    {"character": "앙상블 여성", "scene": "귀부인", "costume": "궁정 드레스", "page": 18, "image_index": 0},
    {"character": "앙상블 여성", "scene": "시민", "costume": "평민 드레스", "page": 19, "image_index": 0},
]

# ===== 오캐롤 의상 데이터 =====
OCAROL_COSTUMES = [
    # 캐롤 킹
    {"character": "캐롤 킹", "scene": "브룩클린 소녀", "costume": "50년대 청순 드레스", "page": 1, "image_index": 0},
    {"character": "캐롤 킹", "scene": "알돈뮤직 취직", "costume": "사무실 정장", "page": 1, "image_index": 1},
    {"character": "캐롤 킹", "scene": "결혼식", "costume": "웨딩 드레스", "page": 2, "image_index": 0},
    {"character": "캐롤 킹", "scene": "작곡가 시절", "costume": "캐주얼 드레스", "page": 2, "image_index": 1},
    {"character": "캐롤 킹", "scene": "이혼 후", "costume": "히피 스타일", "page": 3, "image_index": 0},
    {"character": "캐롤 킹", "scene": "솔로 가수", "costume": "무대 의상", "page": 3, "image_index": 1},
    {"character": "캐롤 킹", "scene": "카네기홀 공연", "costume": "콘서트 드레스", "page": 4, "image_index": 0},

    # 제리 고핀 (남편)
    {"character": "제리 고핀", "scene": "첫 만남", "costume": "캐주얼 정장", "page": 5, "image_index": 0},
    {"character": "제리 고핀", "scene": "작곡가 시절", "costume": "사무실 정장", "page": 5, "image_index": 1},
    {"character": "제리 고핀", "scene": "마지막 장면", "costume": "60년대 패션", "page": 6, "image_index": 0},

    # 신시아 와일
    {"character": "신시아 와일", "scene": "알돈뮤직", "costume": "세련된 드레스", "page": 7, "image_index": 0},
    {"character": "신시아 와일", "scene": "작곡 파트너", "costume": "60년대 패션", "page": 7, "image_index": 1},

    # 배리 만
    {"character": "배리 만", "scene": "피아니스트", "costume": "정장", "page": 8, "image_index": 0},
    {"character": "배리 만", "scene": "작곡가", "costume": "캐주얼 정장", "page": 8, "image_index": 1},

    # 돈 키르쉬너
    {"character": "돈 키르쉬너", "scene": "사장", "costume": "고급 정장", "page": 9, "image_index": 0},

    # 진 클라인 (어머니)
    {"character": "진 클라인", "scene": "가정주부", "costume": "50년대 주부 패션", "page": 10, "image_index": 0},

    # 셜리스 (그룹)
    {"character": "셜리스", "scene": "공연", "costume": "무대 의상 세트", "page": 11, "image_index": 0},

    # 드리프터스
    {"character": "드리프터스", "scene": "공연", "costume": "무대 정장 세트", "page": 12, "image_index": 0},

    # 라이처스 브라더스
    {"character": "라이처스 브라더스", "scene": "공연", "costume": "듀엣 정장", "page": 13, "image_index": 0},
]

# ===== 에드거 앨런 포 의상 데이터 =====
POE_COSTUMES = [
    # 에드거 앨런 포
    {"character": "에드거 앨런 포", "scene": "어린 시절", "costume": "소년 의상", "page": 1, "image_index": 0},
    {"character": "에드거 앨런 포", "scene": "청년 시절", "costume": "대학생 의상", "page": 1, "image_index": 1},
    {"character": "에드거 앨런 포", "scene": "작가 시절", "costume": "검은 프록코트", "page": 2, "image_index": 0},
    {"character": "에드거 앨런 포", "scene": "몰락", "costume": "낡은 검은 옷", "page": 2, "image_index": 1},
    {"character": "에드거 앨런 포", "scene": "최후", "costume": "누더기 코트", "page": 3, "image_index": 0},

    # 버지니아 (아내)
    {"character": "버지니아", "scene": "소녀 시절", "costume": "순수한 흰 드레스", "page": 4, "image_index": 0},
    {"character": "버지니아", "scene": "결혼", "costume": "웨딩 드레스", "page": 4, "image_index": 1},
    {"character": "버지니아", "scene": "아내", "costume": "빅토리안 드레스", "page": 5, "image_index": 0},
    {"character": "버지니아", "scene": "병상", "costume": "흰색 나이트가운", "page": 5, "image_index": 1},

    # 마리아 클렘 (장모)
    {"character": "마리아 클렘", "scene": "가정주부", "costume": "수수한 드레스", "page": 6, "image_index": 0},
    {"character": "마리아 클렘", "scene": "노년", "costume": "검은 드레스", "page": 6, "image_index": 1},

    # 프랜시스 앨런 (양어머니)
    {"character": "프랜시스 앨런", "scene": "부유한 시절", "costume": "화려한 드레스", "page": 7, "image_index": 0},
    {"character": "프랜시스 앨런", "scene": "말년", "costume": "검소한 드레스", "page": 7, "image_index": 1},

    # 존 앨런 (양아버지)
    {"character": "존 앨런", "scene": "부유한 상인", "costume": "고급 정장", "page": 8, "image_index": 0},

    # 사라 엘미라
    {"character": "사라 엘미라", "scene": "첫사랑", "costume": "소녀 드레스", "page": 9, "image_index": 0},
    {"character": "사라 엘미라", "scene": "재회", "costume": "과부 드레스", "page": 9, "image_index": 1},

    # 환상 속 캐릭터들
    {"character": "리지아", "scene": "환상 장면", "costume": "신비로운 드레스", "page": 10, "image_index": 0},
    {"character": "마들렌", "scene": "어셔가의 몰락", "costume": "하얀 수의", "page": 11, "image_index": 0},
    {"character": "레노어", "scene": "까마귀", "costume": "유령 드레스", "page": 12, "image_index": 0},
    {"character": "붉은 죽음의 가면", "scene": "무도회", "costume": "붉은 망토와 가면", "page": 13, "image_index": 0},
]

def get_category_id(conn, category_name="의상"):
    """카테고리 ID 조회 또는 생성"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories WHERE name LIKE ?", (f"%{category_name}%",))
    result = cursor.fetchone()

    if result:
        return result[0]

    # 카테고리가 없으면 생성
    cat_id = str(uuid.uuid4())
    now = datetime.now().isoformat()
    cursor.execute(
        "INSERT INTO categories (id, name, slug, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
        (cat_id, category_name, category_name.lower(), f"{category_name} 카테고리", now, now)
    )
    return cat_id

def get_supplier_id(conn):
    """공급자 ID 조회"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'supplier' OR role = 'admin' LIMIT 1")
    result = cursor.fetchone()
    return result[0] if result else None

def extract_images_from_page(doc, page_num, musical_name):
    """특정 페이지에서 이미지 추출"""
    images = []
    page = doc[page_num]
    image_list = page.get_images()

    for img_index, img in enumerate(image_list):
        xref = img[0]
        try:
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            # 최소 크기 필터 (5KB 이상)
            if len(image_bytes) < 5000:
                continue

            # 파일명 생성
            img_hash = hashlib.md5(image_bytes).hexdigest()[:8]
            filename = f"{musical_name}_p{page_num+1}_img{img_index+1}_{img_hash}.{image_ext}"
            filepath = UPLOAD_DIR / filename

            # 이미지 저장
            with open(filepath, "wb") as f:
                f.write(image_bytes)

            images.append({
                "filename": filename,
                "path": str(filepath),
                "index": img_index,
                "size": len(image_bytes)
            })
        except Exception as e:
            pass  # 이미지 추출 실패 무시

    return images

def clear_old_products(conn, musical_keyword):
    """기존 상품 삭제"""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE title LIKE ?", (f"%{musical_keyword}%",))
    deleted = cursor.rowcount
    print(f"  기존 '{musical_keyword}' 상품 {deleted}개 삭제됨")
    return deleted

def create_product(conn, costume, image_url, supplier_id, musical_name):
    """상품 생성"""
    cursor = conn.cursor()
    product_id = str(uuid.uuid4())
    category_id = get_category_id(conn, "의상")

    title = f"[{musical_name}] {costume['character']} - {costume['scene']} {costume['costume']}"

    description = f"""뮤지컬 '{musical_name}'의 {costume['character']} 캐릭터 의상입니다.

■ 장면: {costume['scene']}
■ 의상: {costume['costume']}

무대 공연, 연극, 뮤지컬, 코스프레 등 다양한 용도로 대여 가능합니다."""

    price = 50000
    now = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO products (id, supplierId, title, description, images, categoryId, baseDailyPrice, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product_id,
        supplier_id,
        title,
        description,
        image_url,
        category_id,
        price,
        "active",
        now,
        now
    ))

    return product_id

def process_musical(conn, supplier_id, pdf_path, musical_name, costumes):
    """뮤지컬 PDF 처리"""
    print(f"\n{'=' * 60}")
    print(f"{musical_name} - 상품 생성")
    print("=" * 60)

    # 기존 상품 삭제
    clear_old_products(conn, musical_name)

    if not pdf_path.exists():
        print(f"  PDF 파일 없음: {pdf_path}")
        return 0

    doc = fitz.open(pdf_path)
    print(f"  PDF 열기 성공: {len(doc)} 페이지")

    created_count = 0
    page_images = {}

    # 각 페이지별 이미지 추출
    for page_num in range(len(doc)):
        images = extract_images_from_page(doc, page_num, musical_name.replace(" ", ""))
        page_images[page_num + 1] = images
        if images:
            print(f"  페이지 {page_num + 1}: {len(images)}개 이미지 추출")

    # 의상 데이터와 이미지 매칭하여 상품 생성
    for costume in costumes:
        page = costume["page"]
        img_idx = costume["image_index"]

        images = page_images.get(page, [])

        if img_idx < len(images):
            image_url = f"http://localhost:3001/uploads/products/{images[img_idx]['filename']}"
        else:
            # 이미지가 없으면 해당 페이지의 첫 번째 이미지 사용
            if images:
                image_url = f"http://localhost:3001/uploads/products/{images[0]['filename']}"
            else:
                # 가장 가까운 페이지의 이미지 사용
                for p in range(page, min(page + 5, len(doc) + 1)):
                    if page_images.get(p):
                        image_url = f"http://localhost:3001/uploads/products/{page_images[p][0]['filename']}"
                        break
                else:
                    image_url = ""

        try:
            create_product(conn, costume, image_url, supplier_id, musical_name)
            created_count += 1
        except Exception as e:
            print(f"  상품 생성 실패: {e}")

    doc.close()
    print(f"  {musical_name}: {created_count}개 상품 생성 완료")
    return created_count

def main():
    print("=" * 60)
    print("뮤지컬 의상 데이터 생성 (나폴레옹, 오캐롤, 에드거앨런포)")
    print("=" * 60)

    conn = sqlite3.connect(str(DB_PATH))

    # 공급자 ID 가져오기
    supplier_id = get_supplier_id(conn)
    if not supplier_id:
        print("공급자 없음. 기본 공급자 생성 중...")
        cursor = conn.cursor()
        supplier_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        cursor.execute("""
            INSERT INTO users (id, email, password, name, role, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (supplier_id, "supplier@example.com", "hashed_password", "기본 공급자", "supplier", now, now))

    # 각 뮤지컬 처리
    total_created = 0

    # 나폴레옹
    napoleon_pdf = SOURCE_DIR / "나폴레옹 의상 파트 바이블" / "2017 나폴레옹 캐릭터별 사진 리스트.pdf"
    if not napoleon_pdf.exists():
        napoleon_pdf = SOURCE_DIR / "2017 나폴레옹 캐릭터별 사진 리스트.pdf"
    total_created += process_musical(conn, supplier_id, napoleon_pdf, "나폴레옹", NAPOLEON_COSTUMES)

    # 오캐롤
    ocarol_pdf = SOURCE_DIR / "오캐롤 의상파트 바이블" / "5.2017 오!캐롤 -배우별 의상바이블.pdf"
    if not ocarol_pdf.exists():
        ocarol_pdf = SOURCE_DIR / "5.2017 오!캐롤 -배우별 의상바이블.pdf"
    total_created += process_musical(conn, supplier_id, ocarol_pdf, "오캐롤", OCAROL_COSTUMES)

    # 에드거 앨런 포
    poe_pdf = SOURCE_DIR / "2016 사람별의상바이블.pdf"
    total_created += process_musical(conn, supplier_id, poe_pdf, "에드거앨런포", POE_COSTUMES)

    conn.commit()

    # 결과 확인
    cursor = conn.cursor()
    print("\n" + "=" * 60)
    print("최종 결과")
    print("=" * 60)

    cursor.execute("""
        SELECT
            CASE
                WHEN title LIKE '%바람%' THEN '바람과 함께 사라지다'
                WHEN title LIKE '%나폴레옹%' THEN '나폴레옹'
                WHEN title LIKE '%오캐롤%' THEN '오캐롤'
                WHEN title LIKE '%에드거%' OR title LIKE '%포%' THEN '에드거앨런포'
                ELSE '기타'
            END as musical,
            COUNT(*) as count
        FROM products
        GROUP BY musical
        ORDER BY musical
    """)

    for row in cursor.fetchall():
        print(f"  {row[0]}: {row[1]}개")

    cursor.execute("SELECT COUNT(*) FROM products")
    total = cursor.fetchone()[0]
    print(f"\n총 상품 수: {total}개")

    conn.close()

if __name__ == "__main__":
    main()
