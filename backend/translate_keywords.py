"""
translate_keywords.py
─────────────────────
แปล keyword ภาษาไทยใน DB → อังกฤษ
ใช้ deep-translator (ฟรี ไม่ต้อง API key)

วิธีใช้:
  pip install deep-translator psycopg2-binary python-dotenv
  python3 translate_keywords.py
"""

import os
import time
import re
from dotenv import load_dotenv

load_dotenv()

def is_thai(text: str) -> bool:
    """เช็คว่ามีตัวอักษรไทยไหม"""
    return bool(re.search(r'[\u0e00-\u0e7f]', text))

def translate_keyword(kw: str, translator) -> str:
    """แปล keyword เดียว ถ้าไม่ใช่ไทยคืนค่าเดิม"""
    if not is_thai(kw):
        return kw.lower().strip()
    try:
        result = translator.translate(kw)
        translated = result.lower().strip()
        # เอาแค่คำแรกถ้าแปลแล้วได้ยาวเกิน (keyword ควรสั้น)
        if len(translated.split()) > 3:
            translated = translated.split()[0]
        print(f"  {kw} → {translated}")
        return translated
    except Exception as e:
        print(f"  ⚠️ แปลไม่ได้: {kw} ({e})")
        return kw  # คืนค่าเดิมถ้าแปลไม่ได้

def main():
    try:
        import psycopg2
        from deep_translator import GoogleTranslator
    except ImportError:
        print("❌ รัน:  pip install deep-translator psycopg2-binary python-dotenv")
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ไม่พบ DATABASE_URL ใน .env")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # ดึง keyword ทั้งหมดที่เป็นไทย
    cur.execute("""
        SELECT id, keyword FROM "CourseKeyword"
        WHERE keyword ~ '[\u0e00-\u0e7f]'
        ORDER BY keyword
    """)
    rows = cur.fetchall()
    print(f"📝 พบ keyword ภาษาไทย {len(rows)} รายการ\n")

    if not rows:
        print("✅ ไม่มี keyword ไทยแล้ว")
        conn.close()
        return

    translator = GoogleTranslator(source='th', target='en')
    updated = 0
    deleted = 0

    for row_id, keyword in rows:
        translated = translate_keyword(keyword, translator)

        if translated == keyword:
            # แปลไม่ได้ ข้ามไป
            continue

        # เช็คว่า keyword ที่แปลแล้วมีอยู่ใน course เดียวกันไหม
        cur.execute("""
            SELECT "courseId" FROM "CourseKeyword" WHERE id = %s
        """, (row_id,))
        course_row = cur.fetchone()
        if not course_row:
            continue
        course_id = course_row[0]

        # เช็คว่า translated keyword มีอยู่แล้วใน course นี้ไหม
        cur.execute("""
            SELECT id FROM "CourseKeyword"
            WHERE "courseId" = %s AND keyword = %s AND id != %s
        """, (course_id, translated, row_id))
        exists = cur.fetchone()

        if exists:
            # มีอยู่แล้ว → ลบอันเก่า (ไทย) ทิ้ง
            cur.execute('DELETE FROM "CourseKeyword" WHERE id = %s', (row_id,))
            deleted += 1
        else:
            # ยังไม่มี → update เป็นอังกฤษ
            cur.execute("""
                UPDATE "CourseKeyword" SET keyword = %s WHERE id = %s
            """, (translated, row_id))
            updated += 1

        # หน่วงนิดนึงไม่ให้ rate limit
        time.sleep(0.1)

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n🎉 เสร็จแล้ว!")
    print(f"   แปลแล้ว: {updated}  |  ลบซ้ำ: {deleted}")

if __name__ == "__main__":
    main()
