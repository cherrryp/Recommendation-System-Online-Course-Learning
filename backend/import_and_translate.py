"""
import_and_translate.py
──────────────────────────────────────────────────
Pipeline: JSON → import DB → translate keywords
วิธีใช้:
  pip install psycopg2-binary python-dotenv deep-translator
  python import_and_translate.py --data ./data

──────────────────────────────────────────────────

# ทำทั้งหมด (import + translate)
python import_and_translate.py --data ./data

# แค่ translate keyword ที่มีอยู่ใน DB แล้ว
python import_and_translate.py --skip-import

# แค่ import ไม่ translate
python import_and_translate.py --skip-translate

"""

import os, json, uuid, re, time, argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── reuse logic จาก import_courses.py ──────────────────────────────────────

def clean_record(raw):
    url = (raw.get("url") or raw.get("course_url") or "").strip()
    if not url: return None
    title = (raw.get("title") or raw.get("course_name") or "").strip()
    if not title: return None

    raw_tags = raw.get("tags") or raw.get("tag") or ""
    keywords = [t.strip().lower() for t in (raw_tags if isinstance(raw_tags, list) else str(raw_tags).split("|")) if t.strip()]

    try: price = float(raw.get("price") or 0)
    except: price = 0.0

    return {
        "id": str(uuid.uuid4()), "title": title,
        "description": (raw.get("description") or raw.get("detail") or "").strip(),
        "category": (raw.get("category") or "General").strip(),
        "university": (raw.get("university") or raw.get("org") or "").strip() or None,
        "instructor": (raw.get("instructor") or "").strip() or None,
        "price": price, "status": (raw.get("status") or "open").strip(),
        "thumbnailUrl": (raw.get("image_url") or raw.get("thumbnail") or "").strip() or None,
        "url": url, "keywords": keywords,
    }

def load_all(data_dir):
    seen_urls, courses = set(), []
    for f in Path(data_dir).glob("*.json"):
        data = json.load(open(f, encoding="utf-8"))
        if isinstance(data, dict): data = list(data.values())[0] if data else []
        for raw in data:
            record = clean_record(raw)
            if record and record["url"] not in seen_urls:
                seen_urls.add(record["url"])
                courses.append(record)
    print(f"โหลดได้ {len(courses)} คอร์ส")
    return courses

def import_to_db(courses, cur):
    inserted = skipped = kw_inserted = 0
    for c in courses:
        try:
            cur.execute("""
                INSERT INTO "Course"
                  (id, title, description, category, university,
                   instructor, price, status, "thumbnailUrl", url, "createdAt")
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
                ON CONFLICT (url) DO NOTHING RETURNING id
            """, (c["id"], c["title"], c["description"], c["category"],
                  c["university"], c["instructor"], c["price"], c["status"],
                  c["thumbnailUrl"], c["url"]))
            row = cur.fetchone()
            if not row: skipped += 1; continue
            inserted += 1
            for kw in c["keywords"]:
                cur.execute("""
                    INSERT INTO "CourseKeyword" (id, "courseId", keyword)
                    VALUES (%s,%s,%s) ON CONFLICT ("courseId", keyword) DO NOTHING
                """, (str(uuid.uuid4()), row[0], kw))
                kw_inserted += 1
        except Exception as e:
            print(f"⚠️  {c['url']}: {e}")
    print(f"Import: {inserted} คอร์ส | ข้าม: {skipped} | keyword: {kw_inserted}")

# ── reuse logic จาก translate_keywords.py ──────────────────────────────────

def is_thai(text): return bool(re.search(r'[\u0e00-\u0e7f]', text))

def translate_keywords(cur):
    from deep_translator import GoogleTranslator
    translator = GoogleTranslator(source='th', target='en')

    cur.execute("""
        SELECT id, keyword FROM "CourseKeyword"
        WHERE keyword ~ '[\u0e00-\u0e7f]' ORDER BY keyword
    """)
    rows = cur.fetchall()
    print(f"\nพบ keyword ไทย {len(rows)} รายการ")
    if not rows: return

    updated = deleted = 0
    for row_id, keyword in rows:
        try:
            translated = translator.translate(keyword).lower().strip()
            if len(translated.split()) > 3: translated = translated.split()[0]
            if translated == keyword: continue
            print(f"  {keyword} → {translated}")
        except: continue

        cur.execute('SELECT "courseId" FROM "CourseKeyword" WHERE id = %s', (row_id,))
        r = cur.fetchone()
        if not r: continue
        course_id = r[0]

        cur.execute("""
            SELECT id FROM "CourseKeyword"
            WHERE "courseId" = %s AND keyword = %s AND id != %s
        """, (course_id, translated, row_id))

        if cur.fetchone():
            cur.execute('DELETE FROM "CourseKeyword" WHERE id = %s', (row_id,))
            deleted += 1
        else:
            cur.execute('UPDATE "CourseKeyword" SET keyword = %s WHERE id = %s', (translated, row_id))
            updated += 1

        time.sleep(0.1)

    print(f"แปลแล้ว: {updated} | ลบซ้ำ: {deleted}")

# ── MAIN ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="./data")
    parser.add_argument("--skip-import", action="store_true", help="ข้าม import ทำแค่ translate")
    parser.add_argument("--skip-translate", action="store_true", help="ข้าม translate ทำแค่ import")
    args = parser.parse_args()

    import psycopg2
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cur = conn.cursor()

    if not args.skip_import:
        print("\n── STEP 1: Import courses ──")
        courses = load_all(args.data)
        import_to_db(courses, cur)
        conn.commit()

    if not args.skip_translate:
        print("\n── STEP 2: Translate keywords ──")
        translate_keywords(cur)
        conn.commit()

    cur.close()
    conn.close()
    print("\nPipeline เสร็จแล้ว!")