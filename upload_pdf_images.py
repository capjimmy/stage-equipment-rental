# -*- coding: utf-8 -*-
import fitz
import os
import json
import requests
import shutil
import sqlite3
from pathlib import Path

# 설정
BACKEND_URL = "http://localhost:3001/api"
UPLOAD_DIR = "c:/Users/parkm/stage-equipment-rental/backend/uploads"
DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_products_from_db():
    """DB에서 직접 상품 조회"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, images FROM products WHERE status = 'active'")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return products

def update_product_images(product_id, image_urls):
    """DB에서 직접 상품 이미지 업데이트"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE products SET images = ? WHERE id = ?",
        (json.dumps(image_urls), product_id)
    )
    conn.commit()
    conn.close()

def extract_and_save_image(doc, page_num, img_idx, xref, product_id):
    """이미지 추출 및 저장"""
    try:
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]

        # 이미지 크기 체크 (너무 작은 이미지 제외)
        if len(image_bytes) < 5000:  # 5KB 미만은 아이콘 등으로 간주
            return None

        filename = f"product_{product_id}_p{page_num}_i{img_idx}.{image_ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)

        with open(filepath, "wb") as f:
            f.write(image_bytes)

        return f"http://localhost:3001/uploads/{filename}"
    except Exception as e:
        print(f"  이미지 추출 실패: {e}")
        return None

def process_baramsa_pdf():
    """바람사 PDF 처리"""
    pdf_path = "c:/Users/parkm/stage-equipment-rental/source/바람사 의상파트 바이블/바람사 장면별 PHOTO LIST - FE (1).pdf"

    products = get_products_from_db()
    baramsa_products = [p for p in products if '[바람사]' in p['title']]
    print(f"바람사 상품: {len(baramsa_products)}개")

    doc = fitz.open(pdf_path)
    print(f"PDF 페이지: {len(doc)}")

    updated_count = 0
    product_idx = 0

    for page_num in range(len(doc)):
        if product_idx >= len(baramsa_products):
            break

        page = doc[page_num]
        images = page.get_images()

        for img_idx, img in enumerate(images):
            if product_idx >= len(baramsa_products):
                break

            product = baramsa_products[product_idx]

            # 이미 이미지가 있으면 스킵
            if product['images'] and product['images'] != 'null':
                product_idx += 1
                continue

            xref = img[0]
            image_url = extract_and_save_image(doc, page_num + 1, img_idx + 1, xref, product['id'])

            if image_url:
                update_product_images(product['id'], [image_url])
                print(f"  {product['title'][:30]}... -> 이미지 업로드 완료")
                updated_count += 1

            product_idx += 1

    doc.close()
    return updated_count

def process_ocarol_pdf():
    """오캐롤 PDF 처리"""
    pdf_path = "c:/Users/parkm/stage-equipment-rental/source/5.2017 오!캐롤 -배우별 의상바이블.pdf"

    products = get_products_from_db()
    ocarol_products = [p for p in products if '[오캐롤]' in p['title']]
    print(f"오캐롤 상품: {len(ocarol_products)}개")

    if not os.path.exists(pdf_path):
        print(f"PDF 파일 없음: {pdf_path}")
        return 0

    doc = fitz.open(pdf_path)
    print(f"PDF 페이지: {len(doc)}")

    updated_count = 0
    product_idx = 0

    for page_num in range(len(doc)):
        if product_idx >= len(ocarol_products):
            break

        page = doc[page_num]
        images = page.get_images()

        for img_idx, img in enumerate(images):
            if product_idx >= len(ocarol_products):
                break

            product = ocarol_products[product_idx]

            if product['images'] and product['images'] != 'null':
                product_idx += 1
                continue

            xref = img[0]
            image_url = extract_and_save_image(doc, page_num + 1, img_idx + 1, xref, product['id'])

            if image_url:
                update_product_images(product['id'], [image_url])
                print(f"  {product['title'][:30]}... -> 이미지 업로드 완료")
                updated_count += 1

            product_idx += 1

    doc.close()
    return updated_count

def process_napoleon_pdf():
    """나폴레옹 PDF 처리"""
    pdf_path = "c:/Users/parkm/stage-equipment-rental/source/2017 나폴레옹 캐릭터별 사진 리스트.pdf"

    products = get_products_from_db()
    napoleon_products = [p for p in products if '[나폴레옹]' in p['title']]
    print(f"나폴레옹 상품: {len(napoleon_products)}개")

    if not os.path.exists(pdf_path):
        print(f"PDF 파일 없음: {pdf_path}")
        return 0

    doc = fitz.open(pdf_path)
    print(f"PDF 페이지: {len(doc)}")

    updated_count = 0
    product_idx = 0

    for page_num in range(len(doc)):
        if product_idx >= len(napoleon_products):
            break

        page = doc[page_num]
        images = page.get_images()

        for img_idx, img in enumerate(images):
            if product_idx >= len(napoleon_products):
                break

            product = napoleon_products[product_idx]

            if product['images'] and product['images'] != 'null':
                product_idx += 1
                continue

            xref = img[0]
            image_url = extract_and_save_image(doc, page_num + 1, img_idx + 1, xref, product['id'])

            if image_url:
                update_product_images(product['id'], [image_url])
                print(f"  {product['title'][:30]}... -> 이미지 업로드 완료")
                updated_count += 1

            product_idx += 1

    doc.close()
    return updated_count

def process_poe_pdf():
    """에드거 앨런 포 PDF 처리"""
    pdf_path = "c:/Users/parkm/stage-equipment-rental/source/2016 사람별의상바이블.pdf"

    products = get_products_from_db()
    poe_products = [p for p in products if '[에드거 앨런 포]' in p['title']]
    print(f"에드거 앨런 포 상품: {len(poe_products)}개")

    if not os.path.exists(pdf_path):
        print(f"PDF 파일 없음: {pdf_path}")
        return 0

    doc = fitz.open(pdf_path)
    print(f"PDF 페이지: {len(doc)}")

    updated_count = 0
    product_idx = 0

    for page_num in range(len(doc)):
        if product_idx >= len(poe_products):
            break

        page = doc[page_num]
        images = page.get_images()

        for img_idx, img in enumerate(images):
            if product_idx >= len(poe_products):
                break

            product = poe_products[product_idx]

            if product['images'] and product['images'] != 'null':
                product_idx += 1
                continue

            xref = img[0]
            image_url = extract_and_save_image(doc, page_num + 1, img_idx + 1, xref, product['id'])

            if image_url:
                update_product_images(product['id'], [image_url])
                print(f"  {product['title'][:30]}... -> 이미지 업로드 완료")
                updated_count += 1

            product_idx += 1

    doc.close()
    return updated_count

if __name__ == "__main__":
    print("=" * 50)
    print("PDF 이미지 추출 및 상품 업로드")
    print("=" * 50)

    total = 0

    print("\n[1] 바람사 처리 중...")
    total += process_baramsa_pdf()

    print("\n[2] 오캐롤 처리 중...")
    total += process_ocarol_pdf()

    print("\n[3] 나폴레옹 처리 중...")
    total += process_napoleon_pdf()

    print("\n[4] 에드거 앨런 포 처리 중...")
    total += process_poe_pdf()

    print("\n" + "=" * 50)
    print(f"총 {total}개 상품에 이미지 업로드 완료!")
    print("=" * 50)
