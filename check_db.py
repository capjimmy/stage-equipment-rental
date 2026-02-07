# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 테이블 목록
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print("Tables:", [t[0] for t in tables])

# products 테이블 확인
for table in tables:
    if 'product' in table[0].lower():
        print(f"\n{table[0]} columns:")
        cursor.execute(f"PRAGMA table_info({table[0]})")
        for col in cursor.fetchall():
            print(f"  {col[1]} ({col[2]})")

conn.close()
