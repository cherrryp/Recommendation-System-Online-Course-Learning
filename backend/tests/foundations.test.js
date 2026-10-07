import { describe, it, expect, vi } from "vitest"
import "./helpers.js"
import { courseGroupKey, dedupeCourses } from "../src/utils/courseKey.js"
import { memo, invalidateUser } from "../src/utils/ttlCache.js"
import { computeProfile, decayFactor } from "../src/service/userProfile.js"
import { mergeMatches } from "../src/service/chatbot/courseSearch.js"

describe("courseGroupKey / dedupeCourses", () => {
  it("treats hour-variants of the same course as one", () => {
    const a = "การปลูกกัญชาในระบบปิด (ชั่วโมงการเรียนรู้ 1 ชั่วโมง)"
    const b = "การปลูกกัญชาในระบบปิด (ชั่วโมงการเรียนรู้ 3 ชั่วโมง)"
    expect(courseGroupKey(a)).toBe(courseGroupKey(b))
  })

  it("keeps the first of each group and honours the exclude list", () => {
    const courses = [
      { id: 1, title: "Intro (ชั่วโมงการเรียนรู้ 1 ชั่วโมง)" },
      { id: 2, title: "Intro (ชั่วโมงการเรียนรู้ 2 ชั่วโมง)" },
      { id: 3, title: "Other" },
      { id: 4, title: "Seen" },
    ]
    expect(dedupeCourses(courses, ["seen"]).map((c) => c.id)).toEqual([1, 3])
  })
})

describe("memo cache", () => {
  it("computes once within the ttl and shares in-flight work", async () => {
    const compute = vi.fn(async () => "value")
    const [a, b] = await Promise.all([memo("k1", 1000, compute), memo("k1", 1000, compute)])
    await memo("k1", 1000, compute)
    expect([a, b]).toEqual(["value", "value"])
    expect(compute).toHaveBeenCalledTimes(1)
  })

  it("recomputes after invalidateUser", async () => {
    const compute = vi.fn(async () => "x")
    await memo("user:u1:home", 1000, compute)
    invalidateUser("u1")
    await memo("user:u1:home", 1000, compute)
    expect(compute).toHaveBeenCalledTimes(2)
  })
})

describe("computeProfile (time decay)", () => {
  const DAY = 24 * 60 * 60 * 1000
  const now = Date.now()
  const course = (id, keywords, embedding) => ({ id, title: `Course ${id}`, category: `Cat ${id}`, keywords, embedding })

  it("halves the weight every 30 days", () => {
    expect(decayFactor(now, now)).toBeCloseTo(1)
    expect(decayFactor(now - 30 * DAY, now)).toBeCloseTo(0.5)
    expect(decayFactor(now - 60 * DAY, now)).toBeCloseTo(0.25)
  })

  it("prefers a recent click over an old bookmark of the same strength", () => {
    const profile = computeProfile({
      now,
      events: [
        { at: now - 120 * DAY, action: "click", course: course("old", ["cooking"]) },
        { at: now - 1 * DAY, action: "click", course: course("new", ["python"]) },
      ],
    })
    expect(profile.keywordScores[0].keyword).toBe("python")
    expect(profile.anchor.id).toBe("new")
  })

  it("builds a normalised embedding and records seen courses/categories", () => {
    const profile = computeProfile({
      now,
      events: [{ at: now, action: "bookmark", course: course("a", ["x"], [3, 4]) }],
    })
    expect(profile.embedding[0]).toBeCloseTo(0.6)
    expect(profile.embedding[1]).toBeCloseTo(0.8)
    expect(profile.seenIds).toEqual(["a"])
    expect(profile.categories).toEqual(["Cat a"])
  })

  it("reports no signal for a brand-new user", () => {
    expect(computeProfile({ events: [], interests: [] }).hasSignal).toBe(false)
  })
})

describe("mergeMatches", () => {
  const base = { category: "C", keywords: [] }
  it("surfaces semantic-only matches and ranks keyword+semantic overlap first", () => {
    const keywordMatches = [{ ...base, id: "k", title: "Cooking basics", keywords: ["cooking"] }]
    const semanticMatches = [
      { ...base, id: "k", title: "Cooking basics", similarity: 0.7 },
      { ...base, id: "s", title: "Food culture", similarity: 0.5 },
    ]
    const out = mergeMatches({ keywordMatches, semanticMatches, terms: ["cooking"], group: null })
    expect(out.map((c) => c.id)).toEqual(["k", "s"])
    expect(out[0]).not.toHaveProperty("similarity")
  })
})
