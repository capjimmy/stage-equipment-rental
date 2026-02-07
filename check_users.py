# -*- coding: utf-8 -*-
import sqlite3

DB_PATH = "c:/Users/parkm/stage-equipment-rental/backend/stage_rental.db"

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("SELECT id, email, passwordHash, role, name FROM users LIMIT 10")
users = cursor.fetchall()

print("Users in database:")
for user in users:
    print(f"  ID: {user[0][:8]}...")
    print(f"  Email: {user[1]}")
    print(f"  Password Hash: {user[2][:30] if user[2] else 'NULL'}...")
    print(f"  Role: {user[3]}")
    print(f"  Name: {user[4]}")
    print()

conn.close()
