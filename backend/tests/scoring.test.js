import { describe, it, expect } from "vitest"
import { weightOf } from "../src/constants/interaction.js"

describe("weightOf", () => {
  it("weights bookmarks above clicks and searches", () => {
    expect(weightOf("bookmark")).toBeGreaterThan(weightOf("click"))
    expect(weightOf("click")).toBe(weightOf("search"))
  })

  it("falls back to 1 for unknown actions", () => {
    expect(weightOf("unknown")).toBe(1)
  })
})
