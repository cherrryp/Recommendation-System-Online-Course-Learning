"""
generate_embeddings.py
──────────────────────
สร้าง embedding สำหรับทุกคอร์สใน DB
ใช้ sentence-transformers (ฟรี ไม่ต้อง API key)

วิธีใช้:
  pip install sentence-transformers psycopg2-binary python-dotenv
  python3.11 generate_embeddings.py

ครั้งแรกจะโหลด model ~500MB (รอสักครู่)
ครั้งต่อไปใช้ cache ได้เลย ไม่ต้องโหลดใหม่
"""

import os
import json
import time
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# model ที่รองรับภาษาไทย + อังกฤษได้ดี
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

def get_course_text(title: str, description: str, category: str, keywords: list[str]) -> str:
    """รวม field ที่สำคัญเป็น text เดียวสำหรับสร้าง embedding"""
    kw_text = " ".join(keywords) if keywords else ""
    return f"{title}. {category}. {kw_text}. {description[:500]}"
    # ตัด description ที่ 500 ตัวอักษร เพื่อไม่ให้ยาวเกิน

def main():
    # โหลด model
    print("⏳ โหลด model (ครั้งแรกอาจใช้เวลา 1-2 นาที)...")
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("❌ รัน:  pip install sentence-transformers")
        return

    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ โหลด model สำเร็จ: {MODEL_NAME}\n")

    # เชื่อม DB
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ ไม่พบ DATABASE_URL ใน .env")
        return

    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # ดึงคอร์สที่ยังไม่มี embedding
    cur.execute("""
        SELECT c.id, c.title, c.description, c.category,
               ARRAY_AGG(ck.keyword) FILTER (WHERE ck.keyword IS NOT NULL) as keywords
        FROM "Course" c
        LEFT JOIN "CourseKeyword" ck ON ck."courseId" = c.id
        LEFT JOIN "CourseEmbedding" ce ON ce."courseId" = c.id
        WHERE ce.id IS NULL
        GROUP BY c.id, c.title, c.description, c.category
        ORDER BY c.title
    """)
    courses = cur.fetchall()
    print(f"📚 คอร์สที่ยังไม่มี embedding: {len(courses)} คอร์ส\n")

    if not courses:
        print("✅ ทุกคอร์สมี embedding แล้ว")
        conn.close()
        return

    # สร้าง embedding เป็น batch
    BATCH_SIZE = 32
    total = len(courses)
    inserted = 0

    for i in range(0, total, BATCH_SIZE):
        batch = courses[i:i + BATCH_SIZE]

        # เตรียม text สำหรับแต่ละคอร์ส
        texts = [
            get_course_text(
                title=row[1],
                description=row[2] or "",
                category=row[3] or "",
                keywords=row[4] or []
            )
            for row in batch
        ]

        # สร้าง embedding ทั้ง batch พร้อมกัน
        embeddings = model.encode(texts, show_progress_bar=False)

        # บันทึกลง DB
        for row, embedding in zip(batch, embeddings):
            course_id = row[0]
            vector_str = "[" + ",".join(f"{x:.6f}" for x in embedding.tolist()) + "]"

            cur.execute("""
                INSERT INTO "CourseEmbedding" (id, "courseId", embedding)
                VALUES (gen_random_uuid(), %s, %s::vector)
                ON CONFLICT ("courseId") DO UPDATE SET embedding = EXCLUDED.embedding
            """, (course_id, vector_str))
            inserted += 1

        conn.commit()
        print(f"  ✓ {min(i + BATCH_SIZE, total)}/{total} คอร์ส")

    cur.close()
    conn.close()

    print(f"\n🎉 เสร็จแล้ว! สร้าง embedding {inserted} คอร์ส")
    print(f"   พร้อมใช้งานระบบแนะนำได้เลย")

if __name__ == "__main__":
    start = time.time()
    main()
    print(f"   ใช้เวลาทั้งหมด: {time.time() - start:.1f} วินาที")
