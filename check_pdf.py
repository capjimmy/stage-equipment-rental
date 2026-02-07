import fitz
import os

# 바람사 의상 PDF 확인
pdf_path = 'c:/Users/parkm/stage-equipment-rental/source/바람사 의상파트 바이블/바람사 장면별 PHOTO LIST - FE (1).pdf'
doc = fitz.open(pdf_path)
print(f'Total pages: {len(doc)}')

# 첫 3페이지 이미지 확인
for page_num in range(min(5, len(doc))):
    page = doc[page_num]
    images = page.get_images()
    print(f'Page {page_num + 1}: {len(images)} images')

doc.close()
