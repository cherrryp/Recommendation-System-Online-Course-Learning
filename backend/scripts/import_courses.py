"""
import_courses.py
─────────────────
ขั้นตอน:
  1. สแกน JSON ทุกไฟล์ในโฟลเดอร์ → แสดง column ที่ต่างกัน
  2. รวม + clean ข้อมูล
  3. import เข้า PostgreSQL ผ่าน DATABASE_URL

วิธีใช้:
  pip install psycopg2-binary python-dotenv
  python import_courses.py --data ./data         (ดู column ก่อน)
  python import_courses.py --data ./data --import (รวมแล้ว import เลย)
"""

import os
import json
import uuid
import argparse
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ─── CONFIG ───────────────────────────────────────────────────────────────────

# โฟลเดอร์ที่เก็บ JSON (เปลี่ยนได้ หรือใช้ --data argument)
DEFAULT_DATA_DIR = "./data"

# weight สำหรับ UserInterest score
WEIGHT = {"bookmark": 3, "click": 1, "search": 1}

# ─── STEP 1: ตรวจสอบ column ──────────────────────────────────────────────────

def inspect_columns(data_dir: str):
    """แสดง column ของแต่ละไฟล์ และ column ที่ต่างกัน"""
    json_files = list(Path(data_dir).glob("*.json"))
    if not json_files:
        print(f"ไม่พบไฟล์ .json ในโฟลเดอร์ {data_dir}")
        return

    print(f"\nพบ {len(json_files)} ไฟล์\n")

    all_columns = {}
    for f in json_files:
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
            # รองรับทั้ง list และ dict ครอบนอก
            if isinstance(data, dict):
                data = list(data.values())[0] if data else []
            if data:
                cols = set(data[0].keys()) if isinstance(data[0], dict) else set()
                all_columns[f.name] = cols
                print(f"  {f.name:<35} {len(data):>5} คอร์ส  |  columns: {sorted(cols)}")

    # หา column ที่ไม่เหมือนกัน
    if all_columns:
        base = set.intersection(*all_columns.values())
        print(f"\nColumn ที่มีทุกไฟล์ ({len(base)}):")
        print(f"   {sorted(base)}")

        for fname, cols in all_columns.items():
            diff = cols - base
            if diff:
                print(f"{fname} มี column เพิ่มเติม: {diff}")

    print("\n─── ถ้า column ใกล้เคียงกัน รัน --import เพื่อ import เลย ───\n")

# ─── STEP 2: clean 1 record ──────────────────────────────────────────────────

def clean_record(raw: dict):
    """
    map JSON field → schema field
    คืน None ถ้า record ไม่มี url (ใช้เป็น unique key)
    """
    url = (raw.get("url") or raw.get("course_url") or "").strip()
    if not url:
        return None

    title = (raw.get("title") or raw.get("course_name") or "").strip()
    if not title:
        return None

    # tags: "excel|programming" → ["excel", "programming"]
    raw_tags = raw.get("tags") or raw.get("tag") or ""
    if isinstance(raw_tags, list):
        keywords = [t.strip().lower() for t in raw_tags if t.strip()]
    else:
        keywords = [t.strip().lower() for t in str(raw_tags).split("|") if t.strip()]

    # price
    try:
        price = float(raw.get("price") or 0)
    except (ValueError, TypeError):
        price = 0.0

    return {
        "id":           str(uuid.uuid4()),
        "title":        title,
        "description":  (raw.get("description") or raw.get("detail") or "").strip(),
        "category":     (raw.get("category") or "General").strip(),
        "university":   (raw.get("university") or raw.get("org") or "").strip() or None,
        "instructor":   (raw.get("instructor") or "").strip() or None,
        "price":        price,
        "status":       (raw.get("status") or "open").strip(),
        "thumbnailUrl": (raw.get("image_url") or raw.get("thumbnail") or "").strip() or None,
        "url":          url,
        "keywords":     keywords,
    }

# ─── STEP 3: โหลดและรวมทุกไฟล์ ───────────────────────────────────────────────

def load_all(data_dir: str) -> list[dict]:
    json_files = list(Path(data_dir).glob("*.json"))
    seen_urls = set()
    courses = []

    for f in json_files:
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        if isinstance(data, dict):
            data = list(data.values())[0] if data else []

        for raw in data:
            record = clean_record(raw)
            if not record:
                continue
            if record["url"] in seen_urls:
                continue  # ข้าม duplicate
            seen_urls.add(record["url"])
            courses.append(record)

    print(f"รวมได้ {len(courses)} คอร์ส (ตัด duplicate แล้ว)")
    return courses

# ─── STEP 4: import เข้า DB ──────────────────────────────────────────────────

def import_to_db(courses: list[dict]):
    try:
        import psycopg2
    except ImportError:
        print("ยังไม่ได้ติดตั้ง psycopg2  →  pip install psycopg2-binary")
        return

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("ไม่พบ DATABASE_URL ใน .env")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    inserted = 0
    skipped = 0
    kw_inserted = 0

    for c in courses:
        try:
            # insert Course (ข้ามถ้า url ซ้ำ)
            cur.execute("""
                INSERT INTO "Course"
                  (id, title, description, category, university,
                   instructor, price, status, "thumbnailUrl", url, "createdAt")
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                ON CONFLICT (url) DO NOTHING
                RETURNING id
            """, (
                c["id"], c["title"], c["description"], c["category"],
                c["university"], c["instructor"], c["price"], c["status"],
                c["thumbnailUrl"], c["url"],
            ))

            row = cur.fetchone()
            if not row:
                skipped += 1
                continue

            course_id = row[0]
            inserted += 1

            # insert keywords
            for kw in c["keywords"]:
                cur.execute("""
                    INSERT INTO "CourseKeyword" (id, "courseId", keyword)
                    VALUES (%s,%s,%s)
                    ON CONFLICT ("courseId", keyword) DO NOTHING
                """, (str(uuid.uuid4()), course_id, kw))
                kw_inserted += 1

            if inserted % 100 == 0:
                print(f"  ... import แล้ว {inserted} คอร์ส")

        except Exception as e:
            print(f"⚠️  error ที่ {c['url']}: {e}")
            conn.rollback()
            continue

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n Import สำเร็จ")
    print(f"   Course  inserted: {inserted}  |  skipped (ซ้ำ): {skipped}")
    print(f"   Keyword inserted: {kw_inserted}")

# ─── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",   default=DEFAULT_DATA_DIR, help="โฟลเดอร์ที่เก็บ JSON")
    parser.add_argument("--import", dest="do_import", action="store_true", help="import เข้า DB เลย")
    args = parser.parse_args()

    # step 1: ตรวจ column เสมอ
    inspect_columns(args.data)

    if args.do_import:
        # step 2-3: โหลด + clean
        courses = load_all(args.data)
        if courses:
            # step 4: import
            import_to_db(courses)
    else:
        print("💡 ถ้า column โอเคแล้ว รัน:  python import_courses.py --data ./data --import\n")
