import { describe, it, expect } from "vitest"
import "./helpers.js"
import { rankPersonalized } from "../src/service/recommendation.service.js"

const course = (id, category, title = `Course ${id}`) => ({ id, title, category, keywords: [] })
const interests = [{ keyword: "python", score: 5 }, { keyword: "data", score: 1 }]

describe("rankPersonalized", () => {
  it("ranks courses by matched interest score", () => {
    const keywordCourses = [
      { ...course("a", "Tech"), keywords: ["data"] },
      { ...course("b", "Tech"), keywords: ["python"] },
    ]
    const out = rankPersonalized({ interests, keywordCourses, similarCourses: [], limit: 2 })
    expect(out.map((c) => c.id)).toEqual(["b", "a"])
  })

  it("blends in embedding similarity and strips internal fields", () => {
    const keywordCourses = [{ ...course("a", "Tech"), keywords: ["python"] }]
    const similarCourses = [{ ...course("s", "Health"), similarity: 0.9 }]
    const out = rankPersonalized({ interests, keywordCourses, similarCourses, limit: 5 })
    expect(out.map((c) => c.id).sort()).toEqual(["a", "s"])
    out.forEach((c) => {
      expect(c).not.toHaveProperty("similarity")
      expect(c).not.toHaveProperty("keywordScore")
      expect(c).not.toHaveProperty("_score")
    })
  })

  it("drops duplicate titles and titles the user has already seen", () => {
    const keywordCourses = [
      { ...course("a", "Tech", "Same Title"), keywords: ["python"] },
      { ...course("b", "Tech", "same title "), keywords: ["python"] },
      { ...course("c", "Tech", "Already Seen"), keywords: ["python"] },
    ]
    const out = rankPersonalized({
      interests, keywordCourses, similarCourses: [], limit: 5, seenKeys: ["already seen"],
    })
    expect(out.map((c) => c.id)).toEqual(["a"])
  })

  it("limits how many results come from one category but still fills the list", () => {
    const keywordCourses = ["1", "2", "3", "4"].map((id) => ({ ...course(id, "Tech"), keywords: ["python"] }))
    keywordCourses.push({ ...course("5", "Health"), keywords: ["data"] })
    const out = rankPersonalized({ interests, keywordCourses, similarCourses: [], limit: 4 })
    expect(out.filter((c) => c.category === "Tech")).toHaveLength(3)
    expect(out.map((c) => c.id)).toContain("5")
    const small = rankPersonalized({ interests, keywordCourses: keywordCourses.slice(0, 4), similarCourses: [], limit: 4 })
    expect(small).toHaveLength(4)
  })
})
