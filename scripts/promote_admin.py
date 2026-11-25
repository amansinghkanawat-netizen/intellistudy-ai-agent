import sqlite3
conn = sqlite3.connect('intellistudy.db')
conn.execute("UPDATE users SET role='admin' WHERE email='admin@test.ai'")
conn.commit()
result = conn.execute("SELECT email, role FROM users WHERE email='admin@test.ai'").fetchone()
print(f"User: {result}")
conn.close()
