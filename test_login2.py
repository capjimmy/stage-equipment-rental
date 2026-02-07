# -*- coding: utf-8 -*-
import sqlite3
import bcrypt

DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# admin 사용자 조회
cursor.execute("SELECT email, passwordHash FROM users WHERE email = 'admin@example.com'")
user = cursor.fetchone()

if user:
    email, password_hash = user
    print(f"Email: {email}")
    print(f"Password Hash: {password_hash}")
    print(f"Hash type: {type(password_hash)}")

    # bcrypt 테스트
    test_password = "password123"
    try:
        # 해시 형식 확인
        print(f"\nHash starts with $2b$: {password_hash.startswith('$2b$')}")

        result = bcrypt.checkpw(test_password.encode('utf-8'), password_hash.encode('utf-8'))
        print(f"Password 'password123' valid: {result}")
    except Exception as e:
        print(f"bcrypt error: {e}")
        import traceback
        traceback.print_exc()
else:
    print("Admin user not found")

conn.close()
