import fitz
import os
import json
import requests
import re
from pathlib import Path

# 설정
BACKEND_URL = "http://localhost:3001/api"
UPLOAD_DIR = "c:/Users/parkm/stage-equipment-rental/backend/uploads"
EXTRACTED_DIR = "c:/Users/parkm/stage-equipment-rental/extracted_images"

# 추출 디렉토리 생성
os.makedirs(EXTRACTED_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_all_products():
    """모든 상품 조회"""
    response = requests.get(f"{BACKEND_URL}/products")
    return response.json()

def extract_images_from_pdf(pdf_path, output_dir, prefix):
    """PDF에서 이미지 추출"""
    doc = fitz.open(pdf_path)
    extracted = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        images = page.get_images()

        for img_idx, img in enumerate(images):
            xref = img[0]
            try:
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]

                # 이미지 저장
                filename = f"{prefix}_p{page_num+1}_img{img_idx+1}.{image_ext}"
                filepath = os.path.join(output_dir, filename)

                with open(filepath, "wb") as f:
                    f.write(image_bytes)

                extracted.append({
                    "page": page_num + 1,
                    "path": filepath,
                    "filename": filename
                })
            except Exception as e:
                print(f"  Error extracting image: {e}")

    doc.close()
    return extracted

def match_image_to_product(products, image_info, musical_name):
    """이미지를 상품과 매칭"""
    # 페이지 번호로 대략적 매칭 (바람사 상품들)
    musical_products = [p for p in products if musical_name in p.get('title', '')]

    if not musical_products:
        return None

    # 페이지 번호로 순차 매칭
    page = image_info['page']
    if page <= len(musical_products):
        return musical_products[page - 1]

    return None

def update_product_image(product_id, image_path):
    """상품 이미지 업데이트"""
    # 이미지를 uploads 폴더로 복사
    filename = os.path.basename(image_path)
    new_filename = f"product_{product_id}_{filename}"
    dest_path = os.path.join(UPLOAD_DIR, new_filename)

    # 파일 복사
    import shutil
    shutil.copy(image_path, dest_path)

    # 상품 업데이트 URL
    image_url = f"http://localhost:3001/uploads/{new_filename}"

    return image_url

# 메인 실행
if __name__ == "__main__":
    print("PDF 이미지 추출 시작...")

    # 1. 모든 상품 조회
    products = get_all_products()
    print(f"총 {len(products)}개 상품 조회됨")

    # 바람사 상품 확인
    baramsa_products = [p for p in products if '[바람사]' in p.get('title', '')]
    print(f"바람사 상품: {len(baramsa_products)}개")

    # 2. 바람사 PDF에서 이미지 추출
    pdf_path = "c:/Users/parkm/stage-equipment-rental/source/바람사 의상파트 바이블/바람사 장면별 PHOTO LIST - FE (1).pdf"

    print(f"\nPDF 분석 중: {pdf_path}")
    doc = fitz.open(pdf_path)
    print(f"총 페이지: {len(doc)}")

    # 각 페이지의 텍스트와 이미지 분석
    for page_num in range(min(10, len(doc))):
        page = doc[page_num]
        text = page.get_text()
        images = page.get_images()

        print(f"\n=== 페이지 {page_num + 1} ===")
        print(f"이미지 수: {len(images)}")

        # 텍스트에서 의상 정보 추출
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        for line in lines[:10]:  # 처음 10줄만 출력
            print(f"  {line}")

    doc.close()
