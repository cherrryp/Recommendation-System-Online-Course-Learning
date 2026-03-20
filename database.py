
"""
database.py
Thin DB access layer for the recommendation API.
Swap out the implementation for your stack; the interface stays the same.
"""
import os
from typing import List, Dict

# ── Choose ONE of the three options below ────────────────────────────────────

# ═══════════════════════════════════════════════════════════════════════════
# OPTION A: Direct PostgreSQL (recommended — fastest)
# pip install psycopg2-binary
# Set DATABASE_URL env var:  postgresql://user:pass@host:5432/dbname
# ═══════════════════════════════════════════════════════════════════════════
import psycopg2
import psycopg2.extras

def _get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_interactions(user_id: str) -> List[Dict]:
    """
    Returns all interactions for a user.
    Maps to Prisma: UserInteraction where userId = user_id
    """
    sql = """
        SELECT "courseId", action, "createdAt"
        FROM "UserInteraction"
        WHERE "userId" = %s
        ORDER BY "createdAt" DESC
    """
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, (user_id,))
            return [dict(r) for r in cur.fetchall()]

def get_user_interests(user_id: str) -> List[Dict]:
    """
    Returns all interest keywords for a user.
    Maps to Prisma: UserInterest where userId = user_id
    """
    sql = """
        SELECT keyword
        FROM "UserInterest"
        WHERE "userId" = %s
    """
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, (user_id,))
            return [dict(r) for r in cur.fetchall()]

def get_all_interactions() -> List[Dict]:
    """
    Returns ALL interactions — used only during model retraining.
    Not called at request time.
    """
    sql = """
        SELECT "userId", "courseId", action
        FROM "UserInteraction"
        ORDER BY "createdAt" ASC
    """
    with _get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql)
            return [dict(r) for r in cur.fetchall()]


# ═══════════════════════════════════════════════════════════════════════════
# OPTION B: Via your Next.js internal API
# Use this if your Python server cannot reach the DB directly
# ═══════════════════════════════════════════════════════════════════════════
# import requests
#
# NEXTJS_SECRET = os.environ["INTERNAL_API_SECRET"]
# NEXTJS_BASE   = os.environ.get("NEXTJS_URL", "http://localhost:3000")
#
# def get_user_interactions(user_id: str) -> List[Dict]:
#     r = requests.get(
#         f"{NEXTJS_BASE}/api/internal/interactions",
#         params={"userId": user_id},
#         headers={"x-internal-secret": NEXTJS_SECRET},
#     )
#     return r.json()
#
# def get_user_interests(user_id: str) -> List[Dict]:
#     r = requests.get(
#         f"{NEXTJS_BASE}/api/internal/interests",
#         params={"userId": user_id},
#         headers={"x-internal-secret": NEXTJS_SECRET},
#     )
#     return r.json()


# ═══════════════════════════════════════════════════════════════════════════
# OPTION C: Prisma Client Python
# pip install prisma  then  prisma generate
# ═══════════════════════════════════════════════════════════════════════════
# from prisma import Prisma
# import asyncio
#
# _db = Prisma()
#
# async def _get_user_interactions_async(user_id: str):
#     await _db.connect()
#     rows = await _db.userinteraction.find_many(where={"userId": user_id})
#     await _db.disconnect()
#     return [{"courseId": r.courseId, "action": r.action} for r in rows]
#
# def get_user_interactions(user_id: str) -> List[Dict]:
#     return asyncio.run(_get_user_interactions_async(user_id))
