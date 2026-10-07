import { describe, it, expect } from "vitest"
import "./helpers.js"
import { parseIntent, extractTopic } from "../src/service/chatbot/intent.js"
import { scoreCourse } from "../src/service/chatbot/courseSearch.js"
import { TOPIC_GROUPS } from "../src/service/chatbot/topics.js"

describe("parseIntent", () => {
  it("detects greetings but not words that merely start with 'hi'", () => {
    expect(parseIntent("สวัสดีครับ").greeting).toBe(true)
    expect(parseIntent("hi").greeting).toBe(true)
    expect(parseIntent("history of rome course").greeting).toBeUndefined()
  })

  it("extracts the topic from a course request", () => {
    expect(parseIntent("อยากเรียน python")).toMatchObject({ wantCourse: true, topic: "python", group: expect.objectContaining({ id: "tech" }) })
    expect(parseIntent("แนะนำคอร์สทำอาหาร")).toMatchObject({ wantCourse: true, topic: "ทำอาหาร" })
  })

  it("treats a bare category name as browsing the whole category", () => {
    const intent = parseIntent("แนะนำคอร์สด้านสุขภาพ")
    expect(intent).toMatchObject({ wantCourse: true, topic: "" })
    expect(intent.group.id).toBe("health")
  })

  it("reads price preference", () => {
    expect(parseIntent("ขอคอร์สฟรีหน่อย")).toMatchObject({ wantCourse: true, price: "free", topic: "" })
    expect(parseIntent("คอร์สเสียเงินด้านธุรกิจ").price).toBe("paid")
  })

  it("answers knowledge questions without searching courses", () => {
    expect(parseIntent("python คืออะไร").wantCourse).toBe(false)
  })

  it("leaves unclear messages for the LLM", () => {
    expect(parseIntent("วันนี้อากาศดีนะ").wantCourse).toBeNull()
  })

  it("keeps Thai words intact when stripping filler", () => {
    expect(extractTopic("อยากเรียน การสอนภาษา")).toBe("การสอนภาษา")
    expect(extractTopic("เรียน excel")).toBe("excel")
  })
})

describe("topic groups", () => {
  it("only reference categories that are non-empty strings and unique ids", () => {
    const ids = TOPIC_GROUPS.map((g) => g.id)
    expect(new Set(ids).size).toBe(ids.length)
    TOPIC_GROUPS.forEach((g) => g.categories.forEach((c) => expect(c).toBeTruthy()))
  })
})

describe("scoreCourse", () => {
  const tech = TOPIC_GROUPS.find((g) => g.id === "tech")
  const make = (over) => ({ title: "Intro", category: "Other", keywords: [], ...over })

  it("ranks a title match above a keyword-only match", () => {
    const inTitle = scoreCourse(make({ title: "Learn Python" }), ["python"], null)
    const inKeyword = scoreCourse(make({ keywords: ["python"] }), ["python"], null)
    expect(inTitle).toBeGreaterThan(inKeyword)
  })

  it("adds a bonus for the matching category group", () => {
    const inGroup = scoreCourse(make({ category: "Data & AI" }), ["x"], tech)
    const outside = scoreCourse(make({ category: "Law & Social Science" }), ["x"], tech)
    expect(inGroup).toBeGreaterThan(outside)
  })
})
