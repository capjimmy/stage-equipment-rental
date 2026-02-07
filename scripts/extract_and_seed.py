#!/usr/bin/env python3
"""
PDF 이미지 추출 및 시드 데이터 생성 스크립트
무대장비 대여 플랫폼 - 바람사, 오캐롤, 나폴레옹, 에드거 앨런 포
"""

import fitz  # PyMuPDF
import os
import json
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

# 카테고리 매핑
CATEGORIES = {
    "의상": "costume",
    "소품": "props",
    "신발": "shoes",
    "악세서리": "accessory",
    "대도구": "large-props",
    "기타": "etc"
}

# 뮤지컬별 PDF 파일 매핑
MUSICAL_PDFS = {
    "바람사": [
        "바람사 의상파트 바이블/바람사 장면별 PHOTO LIST -주조연 (1).pdf",
        "바람사 의상파트 바이블/바람사 장면별 PHOTO LIST - FE (1).pdf",
        "바람사 의상파트 바이블/바람사 장면별 PHOTO LIST - ME.pdf",
        "바람사 의상파트 바이블/바람사 신발 및 액세서리 PHOTO LIST.pdf",
        "40. 바람_2016_소품 BIBLE_0129.pdf",
    ],
    "오캐롤": [
        "오캐롤 의상파트 바이블/8.2017 오!캐롤 -신발 바이블.pdf",
        "오캐롤 의상파트 바이블/7.2017 오!캐롤 -악세사리 바이블.pdf",
    ],
    "나폴레옹": [
        "나폴레옹 의상 파트 바이블/2017 나폴레옹 신발 바이블.pdf",
        "나폴레옹 의상 파트 바이블/2017 나폴레옹 악세서리 바이블.pdf",
        "나폴레옹 의상 파트 바이블/2017 나폴레옹 캐릭터별 사진 리스트.pdf",
    ],
    "에드거앨런포": [
        "포_2016_소품 BIBLE_0719.pdf",
        "포 대도구.pdf",
        "2016 사람별의상바이블.pdf",
    ],
}

def get_category_id(conn, category_name):
    """카테고리 ID 조회 또는 생성"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM categories WHERE name LIKE ?", (f"%{category_name}%",))
    result = cursor.fetchone()
    if result:
        return result[0]

    # 카테고리가 없으면 생성
    cat_id = str(uuid.uuid4())
    cursor.execute(
        "INSERT INTO categories (id, name, slug, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
        (cat_id, category_name, category_name.lower(), f"{category_name} 카테고리", datetime.now().isoformat(), datetime.now().isoformat())
    )
    return cat_id

def get_supplier_id(conn):
    """공급자 ID 조회"""
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE role = 'supplier' OR role = 'admin' LIMIT 1")
    result = cursor.fetchone()
    return result[0] if result else None

def extract_images_from_pdf(pdf_path, output_dir, musical_name, prefix=""):
    """PDF에서 이미지 추출"""
    images = []

    try:
        doc = fitz.open(pdf_path)
        print(f"  처리 중: {pdf_path.name} ({len(doc)} 페이지)")

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images()

            for img_index, img in enumerate(image_list):
                xref = img[0]

                try:
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]

                    # 파일명 생성 (해시 기반)
                    img_hash = hashlib.md5(image_bytes).hexdigest()[:12]
                    filename = f"{musical_name}_{prefix}_p{page_num+1}_{img_index+1}_{img_hash}.{image_ext}"
                    filepath = output_dir / filename

                    # 이미지 저장
                    with open(filepath, "wb") as f:
                        f.write(image_bytes)

                    images.append({
                        "filename": filename,
                        "path": str(filepath),
                        "page": page_num + 1,
                        "size": len(image_bytes),
                        "ext": image_ext
                    })

                except Exception as e:
                    print(f"    이미지 추출 실패 (페이지 {page_num+1}, 이미지 {img_index+1}): {e}")

        doc.close()
        print(f"    추출된 이미지: {len(images)}개")

    except Exception as e:
        print(f"  PDF 열기 실패: {e}")

    return images

def determine_category(filename, content_hint=""):
    """파일명과 내용 힌트로 카테고리 결정"""
    lower_name = filename.lower()
    lower_hint = content_hint.lower()

    if "신발" in filename or "shoes" in lower_name:
        return "신발"
    elif "악세" in filename or "액세" in filename or "accessory" in lower_name:
        return "악세서리"
    elif "소품" in filename or "props" in lower_name:
        return "소품"
    elif "대도구" in filename or "large" in lower_name:
        return "대도구"
    elif "의상" in filename or "costume" in lower_name:
        return "의상"
    else:
        return "의상"  # 기본값

def create_product_from_image(conn, image_info, musical_name, category_name, supplier_id):
    """이미지로부터 상품 생성"""
    cursor = conn.cursor()

    # 카테고리 ID 조회
    category_id = get_category_id(conn, category_name)

    # 상품 ID 생성
    product_id = str(uuid.uuid4())

    # 이미지 URL 생성
    image_url = f"http://localhost:3001/uploads/products/{image_info['filename']}"

    # 상품 제목 생성
    title = f"{musical_name} - {category_name} #{image_info['page']}-{image_info['filename'][:8]}"

    # 상품 설명
    description = f"뮤지컬 '{musical_name}'에서 사용된 {category_name}입니다. PDF 페이지 {image_info['page']}에서 추출됨."

    # 기본 가격 (카테고리별 다르게 설정)
    price_map = {
        "의상": 50000,
        "신발": 30000,
        "악세서리": 15000,
        "소품": 20000,
        "대도구": 100000,
    }
    base_price = price_map.get(category_name, 25000)

    now = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO products (id, supplierId, title, description, images, categoryId, baseDailyPrice, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product_id,
        supplier_id,
        title,
        description,
        image_url,  # simple-array 형식 (쉼표 구분)
        category_id,
        base_price,
        "active",
        now,
        now
    ))

    return product_id

def process_musical(conn, musical_name, pdf_files, supplier_id):
    """뮤지컬별 PDF 처리"""
    print(f"\n{'='*60}")
    print(f"뮤지컬: {musical_name}")
    print(f"{'='*60}")

    total_images = 0
    total_products = 0

    for pdf_file in pdf_files:
        pdf_path = SOURCE_DIR / pdf_file

        if not pdf_path.exists():
            print(f"  파일 없음: {pdf_file}")
            continue

        # 카테고리 결정
        category_name = determine_category(pdf_file)

        # 이미지 추출
        prefix = pdf_path.stem[:20].replace(" ", "_")
        images = extract_images_from_pdf(pdf_path, UPLOAD_DIR, musical_name, prefix)
        total_images += len(images)

        # 상품 생성 (큰 이미지만 - 최소 5KB 이상)
        for img in images:
            if img["size"] > 5000:  # 5KB 이상만
                try:
                    create_product_from_image(conn, img, musical_name, category_name, supplier_id)
                    total_products += 1
                except Exception as e:
                    print(f"    상품 생성 실패: {e}")

    print(f"\n  결과: 이미지 {total_images}개 추출, 상품 {total_products}개 생성")
    return total_products

def main():
    print("=" * 70)
    print("무대장비 대여 플랫폼 - PDF 이미지 추출 및 시드 데이터 생성")
    print("=" * 70)

    # 데이터베이스 연결
    conn = sqlite3.connect(DB_PATH)

    try:
        # 공급자 ID 조회
        supplier_id = get_supplier_id(conn)
        if not supplier_id:
            print("오류: 공급자를 찾을 수 없습니다.")
            return

        print(f"공급자 ID: {supplier_id}")

        # 기존 상품 개수 확인
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM products")
        before_count = cursor.fetchone()[0]
        print(f"기존 상품 수: {before_count}개")

        total_new_products = 0

        # 각 뮤지컬 처리
        for musical_name, pdf_files in MUSICAL_PDFS.items():
            products = process_musical(conn, musical_name, pdf_files, supplier_id)
            total_new_products += products

        # 커밋
        conn.commit()

        # 최종 결과
        cursor.execute("SELECT COUNT(*) FROM products")
        after_count = cursor.fetchone()[0]

        print("\n" + "=" * 70)
        print("처리 완료!")
        print(f"신규 상품: {total_new_products}개")
        print(f"총 상품 수: {after_count}개")
        print("=" * 70)

    except Exception as e:
        print(f"오류 발생: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
