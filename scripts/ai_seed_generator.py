#!/usr/bin/env python3
"""
AI 기반 PDF 분석 및 시드 데이터 생성 스크립트
각 PDF 페이지의 의상 정보를 분석하여 정확한 상품 데이터 생성
"""

import fitz  # PyMuPDF
import os
import json
import sqlite3
import uuid
import hashlib
from pathlib import Path
from datetime import datetime
import re

# 경로 설정
BASE_DIR = Path("c:/Users/parkm/stage-equipment-rental")
SOURCE_DIR = BASE_DIR / "source"
UPLOAD_DIR = BASE_DIR / "backend" / "uploads" / "products"
DB_PATH = BASE_DIR / "backend" / "stage_rental.db"

# 업로드 디렉토리 생성
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 바람사 캐릭터별 의상 데이터 (PDF 분석 결과)
BARAMSA_COSTUMES = [
    # 페이지 1 - 스칼렛 오하라
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "나만의고독~우리들은모르는거야",
        "costume": "초록색 꽃무늬 드레스",
        "description": "속바지/초록색꽃무늬상의/스커트/하얀색 3단 와이어패치",
        "shoes": "하얀 구두",
        "accessories": "귀걸이/밀짚모자",
        "category": "의상",
        "page": 1,
        "image_index": 0
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "버틀러와의 첫만남~전쟁발발",
        "costume": "초록색 꽃무늬 드레스 (동일)",
        "description": "속바지/초록색꽃무늬상의/스커트/하얀색 3단 와이어패치",
        "shoes": "하얀 구두",
        "accessories": "귀걸이",
        "category": "의상",
        "page": 1,
        "image_index": 0
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "무도회",
        "costume": "남색 비즈 드레스",
        "description": "속바지/남색 비즈 드레스 상의/스커트/검정 3단패치",
        "shoes": "검정 구두",
        "accessories": "브로치/레이스장갑",
        "category": "의상",
        "page": 1,
        "image_index": 1
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "엄마이제 돌아가요~맹세",
        "costume": "체크 스커트 세트",
        "description": "하얀색 바디수트형 블라우스/체크 스커트/검정 3단패치",
        "shoes": "갈색 워커",
        "accessories": "하늘색 벨트",
        "category": "의상",
        "page": 1,
        "image_index": 2
    },
    # 페이지 2 - 스칼렛 오하라 (계속)
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "폐허가 된 타라~스칼렛",
        "costume": "더러운 체크 스커트 세트",
        "description": "속바지/흰 뷔스티에/더러운 셔츠/더러운 체크 스커트",
        "shoes": "갈색 워커",
        "accessories": "",
        "category": "의상",
        "page": 2,
        "image_index": 0
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "폐허가 된 타라",
        "costume": "흰 뷔스티에",
        "description": "속바지/흰 뷔스티에",
        "shoes": "갈색 워커",
        "accessories": "",
        "category": "의상",
        "page": 2,
        "image_index": 1
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "가라앉아",
        "costume": "초록색 버슬패치 드레스",
        "description": "속바지/흰 뷔스티에/초록색 버슬패치",
        "shoes": "갈색 워커",
        "accessories": "",
        "category": "의상",
        "page": 2,
        "image_index": 2
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "가라앉아",
        "costume": "초록색 버슬패치 스커트 세트",
        "description": "속바지/흰 뷔스티에/스커트/초록색 버슬패치",
        "shoes": "갈색 워커",
        "accessories": "",
        "category": "의상",
        "page": 2,
        "image_index": 3
    },
    # 페이지 3 - 스칼렛 오하라 (계속)
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "가라앉아~거짓말",
        "costume": "커튼 드레스 (그린)",
        "description": "속바지/흰 뷔스티에/커튼드레스 상의/스커트/초록색 버슬패치",
        "shoes": "갈색 워커",
        "accessories": "초록색 모자",
        "category": "의상",
        "page": 3,
        "image_index": 0
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "케네디의 방~버틀러의 청혼",
        "costume": "검정 벨벳 드레스",
        "description": "속바지/흰 뷔스티에/검정벨벳자켓/스커트/검정색 버슬패치",
        "shoes": "검정 구두",
        "accessories": "브로치",
        "category": "의상",
        "page": 3,
        "image_index": 1
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "스캔들",
        "costume": "빨간 자켓 세트",
        "description": "빨강 자켓/흰 스커트/하얀색 버슬패치",
        "shoes": "빨간 구두",
        "accessories": "자수 리본/빨강 모자",
        "category": "의상",
        "page": 3,
        "image_index": 2
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "저택 계단~보니의 죽음",
        "costume": "빨간색 가운",
        "description": "하얀색 속치마/흰 뷔스티에/빨간색 가운",
        "shoes": "빨간 구두",
        "accessories": "",
        "category": "의상",
        "page": 3,
        "image_index": 3
    },
    # 페이지 4 - 스칼렛 오하라 & 보니
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "사랑했어",
        "costume": "남색 바디수트형 블라우스 세트",
        "description": "남색 바디수트형 블라우스/남색 스커트/검정 3단패치",
        "shoes": "검정 구두",
        "accessories": "",
        "category": "의상",
        "page": 4,
        "image_index": 0
    },
    {
        "character": "스칼렛 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "커튼콜",
        "costume": "초록색 꽃무늬 드레스 (커튼콜)",
        "description": "속바지/초록색꽃무늬상의/스커트/하얀색 3단 와이어패치",
        "shoes": "하얀 구두",
        "accessories": "귀걸이",
        "category": "의상",
        "page": 4,
        "image_index": 1
    },
    {
        "character": "보니",
        "musical": "바람과 함께 사라지다",
        "scene": "버틀러와 보니/보니의 죽음",
        "costume": "파란색 원피스",
        "description": "파란색 원피스",
        "shoes": "하얀 구두(개인준비)",
        "accessories": "",
        "category": "의상",
        "page": 4,
        "image_index": 2
    },
    # 페이지 5 - 멜라니
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "바비큐 파티",
        "costume": "오렌지색 드레스",
        "description": "속바지/오렌지색 드레스 상의/스커트/하얀색 3단 와이어패치",
        "shoes": "분홍색 구두",
        "accessories": "진주귀걸이",
        "category": "의상",
        "page": 5,
        "image_index": 0
    },
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "무도회",
        "costume": "검정색 상복 드레스",
        "description": "속바지/검정색 상복 드레스/검정 3단패치",
        "shoes": "하늘색 구두",
        "accessories": "임신 배 쿠션",
        "category": "의상",
        "page": 5,
        "image_index": 1
    },
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "멜라니의 독백",
        "costume": "파란색 퍼프소매 임부복 드레스",
        "description": "속바지/파란색 퍼프소매 임부복 드레스",
        "shoes": "하늘색 구두",
        "accessories": "임신 배 쿠션",
        "category": "의상",
        "page": 5,
        "image_index": 2
    },
    # 페이지 6 - 멜라니 & 스칼렛 스턴트
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "집으로 돌아가요~맹세",
        "costume": "흰색 잠옷원피스",
        "description": "속바지/흰색 잠옷원피스/니트 숄",
        "shoes": "",
        "accessories": "",
        "category": "의상",
        "page": 6,
        "image_index": 0
    },
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "폐허가 된 타라",
        "costume": "더러운 블라우스 세트",
        "description": "속바지/더러운 블라우스/더러운 체크스커트/검정 1단패치",
        "shoes": "검정워커",
        "accessories": "",
        "category": "의상",
        "page": 6,
        "image_index": 1
    },
    {
        "character": "멜라니",
        "musical": "바람과 함께 사라지다",
        "scene": "당신들이 아나요/커튼콜",
        "costume": "하늘색 자켓 세트",
        "description": "속바지/하늘색 자켓/하늘색 스커트/흰색 3단패치",
        "shoes": "하늘색 구두",
        "accessories": "",
        "category": "의상",
        "page": 6,
        "image_index": 2
    },
    {
        "character": "스칼렛 스턴트",
        "musical": "바람과 함께 사라지다",
        "scene": "저택 계단",
        "costume": "빨간 가운 (스턴트용)",
        "description": "하얀민소매/하얀속바지/하얀속치마/빨간가운/하얀스타킹/하얀반스타킹",
        "shoes": "빨간 구두",
        "accessories": "",
        "category": "의상",
        "page": 6,
        "image_index": 3
    },
    # 페이지 7 - 유모 & 벨
    {
        "character": "유모",
        "musical": "바람과 함께 사라지다",
        "scene": "기본의상",
        "costume": "유모 기본 의상",
        "description": "속바지/흰 카라/검정원피스/검정패치/깨끗한 앞치마/흰 두건",
        "shoes": "검정워커",
        "accessories": "",
        "category": "의상",
        "page": 7,
        "image_index": 0
    },
    {
        "character": "유모",
        "musical": "바람과 함께 사라지다",
        "scene": "모든것을 잃었네",
        "costume": "유모 더러운 의상",
        "description": "속바지/흰 카라/검정원피스/검정패치/더러운 앞치마/흰 두건",
        "shoes": "검정워커",
        "accessories": "",
        "category": "의상",
        "page": 7,
        "image_index": 1
    },
    {
        "character": "벨",
        "musical": "바람과 함께 사라지다",
        "scene": "파라다이스",
        "costume": "은색 비즈 드레스",
        "description": "은색비즈드레스/망사스타킹/흰 깃털 버슬 장식",
        "shoes": "빨강 구두",
        "accessories": "목걸이/귀걸이/팔찌/나비 머리장식",
        "category": "의상",
        "page": 7,
        "image_index": 2
    },
    {
        "character": "벨",
        "musical": "바람과 함께 사라지다",
        "scene": "결혼해/커튼콜",
        "costume": "빨강 드레스",
        "description": "빨강드레스/망사스타킹/빨강팬티",
        "shoes": "빨강 구두",
        "accessories": "목걸이/귀걸이/팔찌/모자 머리장식",
        "category": "의상",
        "page": 7,
        "image_index": 3
    },
    # 페이지 8 - 레트 버틀러
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "바비큐 파티",
        "costume": "검정 자켓 정장",
        "description": "러플셔츠/검정바지/금색조끼/검정자켓",
        "shoes": "검정 구두",
        "accessories": "금색타이",
        "category": "의상",
        "page": 8,
        "image_index": 0
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "무도회",
        "costume": "흰색 정장",
        "description": "러플셔츠/흰색바지/흰색조끼/흰색자켓",
        "shoes": "흰색 구두",
        "accessories": "흰색타이",
        "category": "의상",
        "page": 8,
        "image_index": 1
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "파라다이스",
        "costume": "회색 조끼 셔츠",
        "description": "하이넥셔츠/회색바지/회색조끼",
        "shoes": "흰색 구두",
        "accessories": "",
        "category": "의상",
        "page": 8,
        "image_index": 2
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "멜라니의 집",
        "costume": "회색 롱 코트",
        "description": "하이넥셔츠/회색바지/회색조끼/회색 롱 코트",
        "shoes": "흰색 구두",
        "accessories": "",
        "category": "의상",
        "page": 8,
        "image_index": 3
    },
    # 페이지 9 - 레트 버틀러 (계속)
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "감옥(거짓말)",
        "costume": "회색 조끼 (감옥)",
        "description": "핀턱셔츠/검정바지/회색조끼",
        "shoes": "검정 구두",
        "accessories": "",
        "category": "의상",
        "page": 9,
        "image_index": 0
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "버틀러의 청혼",
        "costume": "자주색 코트",
        "description": "핀턱셔츠/검정바지/회색조끼/자주색코트",
        "shoes": "검정 구두",
        "accessories": "자주색 타이",
        "category": "의상",
        "page": 9,
        "image_index": 1
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "보니의 탄생",
        "costume": "보라색 자켓",
        "description": "핀턱셔츠/검정바지/보라색조끼/보라색자켓",
        "shoes": "검정 구두",
        "accessories": "보라색타이",
        "category": "의상",
        "page": 9,
        "image_index": 2
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "널 데려간 바람~보니의 죽음",
        "costume": "보라색 조끼",
        "description": "핀턱셔츠/검정바지/보라색조끼",
        "shoes": "검정 구두",
        "accessories": "",
        "category": "의상",
        "page": 9,
        "image_index": 3
    },
    # 페이지 10 - 레트 버틀러 (계속)
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "사랑했어",
        "costume": "보라색 롱코트",
        "description": "핀턱셔츠/검정바지/보라색조끼/보라색 롱코트",
        "shoes": "검정 구두",
        "accessories": "보라색타이",
        "category": "의상",
        "page": 10,
        "image_index": 0
    },
    {
        "character": "레트 버틀러",
        "musical": "바람과 함께 사라지다",
        "scene": "커튼콜",
        "costume": "회색 롱 코트 (커튼콜)",
        "description": "핀턱셔츠/검정바지/회색조끼/회색 롱 코트",
        "shoes": "검정 구두",
        "accessories": "",
        "category": "의상",
        "page": 10,
        "image_index": 1
    },
    # 페이지 11 - 애슐리 윌크스
    {
        "character": "애슐리 윌크스",
        "musical": "바람과 함께 사라지다",
        "scene": "바비큐 파티",
        "costume": "빨간 자켓 정장",
        "description": "러플셔츠/아이보리색바지/금색조끼/빨간 자켓",
        "shoes": "갈색 워커",
        "accessories": "분홍색 리본타이",
        "category": "의상",
        "page": 11,
        "image_index": 0
    },
    {
        "character": "애슐리 윌크스",
        "musical": "바람과 함께 사라지다",
        "scene": "무도회",
        "costume": "남부군 군복",
        "description": "청녹색 군복바지/청녹색 군복자켓",
        "shoes": "갈색 롱부츠",
        "accessories": "남부군 벨트",
        "category": "의상",
        "page": 11,
        "image_index": 1
    },
    {
        "character": "애슐리 윌크스",
        "musical": "바람과 함께 사라지다",
        "scene": "폐허가 된 타라",
        "costume": "낡은 남부군 군복",
        "description": "낡은 셔츠/청녹색 군복바지/낡은 군복자켓",
        "shoes": "갈색 롱부츠",
        "accessories": "",
        "category": "의상",
        "page": 11,
        "image_index": 2
    },
    {
        "character": "애슐리 윌크스",
        "musical": "바람과 함께 사라지다",
        "scene": "스칼렛",
        "costume": "회색 작업복",
        "description": "낡은 셔츠/회색 작업복 바지",
        "shoes": "밤색 워커",
        "accessories": "",
        "category": "의상",
        "page": 11,
        "image_index": 3
    },
    # 페이지 12 - 애슐리 윌크스, 제럴드 오하라, 노예장
    {
        "character": "애슐리 윌크스",
        "musical": "바람과 함께 사라지다",
        "scene": "스캔들/죽었어/커튼콜",
        "costume": "남색 자켓 정장",
        "description": "러플셔츠/남색 바지/하늘색 조끼/남색 자켓",
        "shoes": "갈색 워커",
        "accessories": "노란색 리본타이",
        "category": "의상",
        "page": 12,
        "image_index": 0
    },
    {
        "character": "제럴드 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "바비큐 파티/커튼콜",
        "costume": "검정 정장",
        "description": "핀턱셔츠/검정바지/은색조끼/검정자켓",
        "shoes": "검정 구두",
        "accessories": "은색 리본타이",
        "category": "의상",
        "page": 12,
        "image_index": 1
    },
    {
        "character": "제럴드 오하라",
        "musical": "바람과 함께 사라지다",
        "scene": "모든것을 잃었네",
        "costume": "더러운 정장",
        "description": "더러운 셔츠/더러운 바지/더러운 조끼/더러운 자켓",
        "shoes": "더러운 구두",
        "accessories": "",
        "category": "의상",
        "page": 12,
        "image_index": 2
    },
    {
        "character": "노예장",
        "musical": "바람과 함께 사라지다",
        "scene": "검다는 것, 인간은, 커튼콜",
        "costume": "노예 바지",
        "description": "노예 바지",
        "shoes": "스웨이드 노예신발",
        "accessories": "노예장 팔찌",
        "category": "의상",
        "page": 12,
        "image_index": 3
    },
]

def get_category_id(conn, category_name):
    """카테고리 ID 조회 또는 생성"""
    cursor = conn.cursor()

    # 카테고리 이름 매핑
    cat_map = {
        "의상": "의상",
        "신발": "신발",
        "악세서리": "악세서리",
        "소품": "소품",
        "대도구": "대도구"
    }

    search_name = cat_map.get(category_name, category_name)
    cursor.execute("SELECT id FROM categories WHERE name LIKE ?", (f"%{search_name}%",))
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

def extract_images_from_page(doc, page_num, output_dir, musical_name, prefix=""):
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
            filepath = output_dir / filename

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
            print(f"    이미지 추출 실패: {e}")

    return images

def clear_old_products(conn, musical_keyword):
    """기존 상품 삭제"""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM products WHERE title LIKE ?", (f"%{musical_keyword}%",))
    deleted = cursor.rowcount
    print(f"  삭제된 상품: {deleted}개")
    return deleted

def create_product(conn, costume_data, image_url, supplier_id):
    """상품 생성"""
    cursor = conn.cursor()

    category_id = get_category_id(conn, costume_data["category"])
    product_id = str(uuid.uuid4())

    # 상품 제목 생성
    title = f"[{costume_data['musical'][:4]}] {costume_data['character']} - {costume_data['costume']}"

    # 상세 설명 생성
    description = f"""뮤지컬 '{costume_data['musical']}'의 {costume_data['character']} 캐릭터 의상입니다.

■ 장면: {costume_data['scene']}
■ 의상 구성: {costume_data['description']}
■ 신발: {costume_data['shoes'] or '별도'}
■ 악세서리: {costume_data['accessories'] or '없음'}

무대 공연, 연극, 뮤지컬, 코스프레 등 다양한 용도로 대여 가능합니다."""

    # 기본 가격
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

def process_baramsa(conn, supplier_id):
    """바람사 PDF 처리"""
    print("\n" + "=" * 60)
    print("바람과 함께 사라지다 - AI 분석 기반 상품 생성")
    print("=" * 60)

    # 기존 바람사 상품 삭제
    clear_old_products(conn, "바람")

    pdf_path = SOURCE_DIR / "바람사 의상파트 바이블" / "바람사 장면별 PHOTO LIST -주조연 (1).pdf"

    if not pdf_path.exists():
        print(f"  PDF 파일 없음: {pdf_path}")
        return 0

    doc = fitz.open(pdf_path)
    print(f"  PDF 열기 성공: {len(doc)} 페이지")

    created_count = 0
    page_images = {}

    # 각 페이지별 이미지 추출
    for page_num in range(len(doc)):
        images = extract_images_from_page(doc, page_num, UPLOAD_DIR, "바람사")
        page_images[page_num + 1] = images
        print(f"  페이지 {page_num + 1}: {len(images)}개 이미지 추출")

    # 의상 데이터와 이미지 매칭하여 상품 생성
    for costume in BARAMSA_COSTUMES:
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
                image_url = ""

        try:
            create_product(conn, costume, image_url, supplier_id)
            created_count += 1
        except Exception as e:
            print(f"    상품 생성 실패: {costume['costume']} - {e}")

    doc.close()
    print(f"\n  생성된 상품: {created_count}개")
    return created_count

def main():
    print("=" * 70)
    print("AI 기반 PDF 분석 및 시드 데이터 생성")
    print("=" * 70)

    conn = sqlite3.connect(DB_PATH)

    try:
        supplier_id = get_supplier_id(conn)
        if not supplier_id:
            print("오류: 공급자를 찾을 수 없습니다.")
            return

        print(f"공급자 ID: {supplier_id}")

        # 바람사 처리
        baramsa_count = process_baramsa(conn, supplier_id)

        conn.commit()

        print("\n" + "=" * 70)
        print("처리 완료!")
        print(f"바람사 상품: {baramsa_count}개")
        print("=" * 70)

    except Exception as e:
        print(f"오류 발생: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
