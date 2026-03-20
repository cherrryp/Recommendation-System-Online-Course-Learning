
"""
api/main.py — Course Recommendation API v2

Run:
    uvicorn api.main:app --reload --port 8000

Endpoints:
    GET  /api/recommendations     personalised courses for a user
    GET  /api/similar-courses/:id courses similar to a given course
    GET  /api/popular-courses     globally popular courses
    GET  /health                  liveness check
"""

import pickle
from pathlib import Path
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Import your DB layer ───────────────────────────────────────────────────────
# Make sure database.py is in the same directory and configured correctly
from database import get_user_interactions, get_user_interests


# ── Load model artefacts once at startup ─────────────────────────────────────
MODEL_PATH = Path("model_artifacts/recommendation_model.pkl")
with open(MODEL_PATH, "rb") as f:
    M = pickle.load(f)

cos_sim_matrix   = M["cos_sim_matrix"]
item_factors     = M["item_factors"]
courses_df       = M["courses_df"]
course_id_to_idx = M["course_id_to_idx"]
idx_to_course_id = M["idx_to_course_id"]
popular_courses  = M["popular_courses"]
CONFIG           = M["config"]
course_content_lower = courses_df["content"].str.lower().tolist()


# ── FastAPI setup ─────────────────────────────────────────────────────────────
app = FastAPI(title="Course Recommendation API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-react-app.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ──────────────────────────────────────────────────────────
class CourseRecommendation(BaseModel):
    course_id:          str
    course_name_en:     str
    course_name_th:     str
    category:           str
    university:         str
    target_group:       str
    total_duration_min: float
    lesson_count:       int
    hybrid_score:       float
    content_score:      float
    collab_score:       float
    keyword_score:      float

class RecommendationResponse(BaseModel):
    user_id:           str
    strategy:          str   # "hybrid" | "keyword_only" | "popular"
    user_has_history:  bool
    recommendations:   List[CourseRecommendation]


# ── Core helpers ──────────────────────────────────────────────────────────────
def _normalise(arr):
    mn, mx = arr.min(), arr.max()
    if mx - mn < 1e-10:
        return arr * 0
    return (arr - mn) / (mx - mn)


def _hybrid_scores(live_interactions, live_interests, category_filter, limit):
    """
    Compute hybrid scores from live DB data.
    Works for ANY user — new or existing — via virtual SVD projection.
    """
    # Build live user vector
    live_vec = np.zeros(len(courses_df))
    for row in live_interactions:
        cid    = row.get("courseId", "")
        action = row.get("action", "")
        if cid in course_id_to_idx:
            live_vec[course_id_to_idx[cid]] += CONFIG["interaction_weights"].get(action, 1)

    seen = live_vec > 0

    # Content score
    cb = live_vec @ cos_sim_matrix
    cb[seen] = 0

    # Collaborative score via virtual projection
    if live_vec.sum() > 0:
        cf = (live_vec @ item_factors) @ item_factors.T
    else:
        cf = np.zeros(len(courses_df))
    cf[seen] = 0

    # Keyword score
    keywords = [r.get("keyword", "").lower() for r in live_interests if r.get("keyword")]
    if keywords:
        kw = np.array([
            sum(k in c for k in keywords) / len(keywords)
            for c in course_content_lower
        ])
    else:
        kw = np.zeros(len(courses_df))

    hybrid = (
        CONFIG["alpha_content"] * _normalise(cb) +
        CONFIG["alpha_collab"]  * _normalise(cf) +
        CONFIG["alpha_keyword"] * _normalise(kw)
    )

    result = courses_df[[
        "course_id", "course_name_en", "course_name_th",
        "category", "university", "target_group_clean",
        "total_duration_min", "lesson_count"
    ]].copy()
    result["hybrid_score"]  = hybrid
    result["content_score"] = _normalise(cb)
    result["collab_score"]  = _normalise(cf)
    result["keyword_score"] = _normalise(kw)

    if category_filter:
        result = result[result["category"] == category_filter]

    return result.sort_values("hybrid_score", ascending=False).head(limit)


def _rows_to_recs(df) -> List[CourseRecommendation]:
    return [
        CourseRecommendation(
            course_id          = row["course_id"],
            course_name_en     = str(row.get("course_name_en") or ""),
            course_name_th     = str(row.get("course_name_th") or ""),
            category           = str(row.get("category") or ""),
            university         = str(row.get("university") or ""),
            target_group       = str(row.get("target_group_clean") or ""),
            total_duration_min = float(row.get("total_duration_min") or 0),
            lesson_count       = int(row.get("lesson_count") or 0),
            hybrid_score       = float(row.get("hybrid_score") or 0),
            content_score      = float(row.get("content_score") or 0),
            collab_score       = float(row.get("collab_score") or 0),
            keyword_score      = float(row.get("keyword_score") or 0),
        )
        for _, row in df.iterrows()
    ]


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/recommendations", response_model=RecommendationResponse)
def get_recommendations(
    userId:   str           = Query(..., description="Prisma User.id"),
    limit:    int           = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
):
    """
    Personalised recommendations for any user.

    Always queries live data from the DB — new users get personalised
    recommendations immediately after their first interaction.

    Strategy logic:
      has interactions → "hybrid" (content + collaborative + keyword)
      no interactions, has interests → "keyword_only"
      no interactions, no interests  → "popular"
    """
    # ── Fetch LIVE data from DB ───────────────────────────────────────────────
    live_interactions = get_user_interactions(userId)   # [{courseId, action}, ...]
    live_interests    = get_user_interests(userId)       # [{keyword}, ...]

    has_history = len(live_interactions) > 0

    if has_history:
        # Full hybrid model with virtual SVD projection
        df       = _hybrid_scores(live_interactions, live_interests, category, limit)
        strategy = "hybrid"

    elif live_interests:
        # No interactions yet, but user has declared interests
        keywords = [r.get("keyword", "").lower() for r in live_interests if r.get("keyword")]
        scores   = np.array([
            sum(k in c for k in keywords) / len(keywords)
            for c in course_content_lower
        ])
        df = courses_df[[
            "course_id","course_name_en","course_name_th",
            "category","university","target_group_clean",
            "total_duration_min","lesson_count"
        ]].copy()
        df["hybrid_score"] = df["content_score"] = df["keyword_score"] = scores
        df["collab_score"] = 0.0
        if category:
            df = df[df["category"] == category]
        df       = df.sort_values("hybrid_score", ascending=False).head(limit)
        strategy = "keyword_only"

    else:
        # Absolute cold-start — return popular courses
        df = popular_courses.copy()
        if category:
            df = df[df["category"] == category]
        df = df.head(limit)
        for col in ["hybrid_score","content_score","collab_score","keyword_score"]:
            df[col] = df.get("bayesian_popularity", 0.0)
        strategy = "popular"

    return RecommendationResponse(
        user_id          = userId,
        strategy         = strategy,
        user_has_history = has_history,
        recommendations  = _rows_to_recs(df),
    )


@app.get("/api/similar-courses/{courseId}")
def get_similar_courses(
    courseId: str,
    limit:    int = Query(6, ge=1, le=50)
):
    """Return courses most similar to a given course (for course detail page)."""
    if courseId not in course_id_to_idx:
        raise HTTPException(status_code=404, detail=f"Course {courseId!r} not found")

    c_idx   = course_id_to_idx[courseId]
    sim_vec = cos_sim_matrix[c_idx].copy()
    sim_vec[c_idx] = 0

    top_idxs = np.argsort(sim_vec)[::-1][:limit]
    result   = courses_df.iloc[top_idxs][[
        "course_id","course_name_en","course_name_th","category","university"
    ]].copy()
    result["similarity"] = sim_vec[top_idxs]
    return result.to_dict(orient="records")


@app.get("/api/popular-courses")
def get_popular_courses(
    limit:    int           = Query(10, ge=1, le=274),
    category: Optional[str] = Query(None),
):
    """
    Globally popular courses.
    Returns up to 274 (all courses). Fix from v1 which was capped at 20.
    """
    df = popular_courses.copy()
    if category:
        df = df[df["category"] == category]
    return df.head(limit)[[
        "course_id","course_name_en","course_name_th",
        "category","university","bayesian_popularity"
    ]].to_dict(orient="records")


@app.get("/health")
def health():
    return {
        "status"       : "ok",
        "version"      : "2.0.0",
        "courses"      : M["n_courses"],
        "training_users": M["n_training_users"],
        "trained_at"   : M["trained_at"],
        "data_source"  : M["data_source"],
    }
