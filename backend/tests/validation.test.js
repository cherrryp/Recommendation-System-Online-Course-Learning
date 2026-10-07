import { describe, it, expect, vi } from "vitest"
import request from "supertest"
import "./helpers.js"

vi.mock("../src/lib/prisma.js", () => ({ default: { user: { findUnique: vi.fn() } } }))

const { default: app } = await import("../src/index.js")

describe("input validation", () => {
  it("rejects a malformed registration", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "a", email: "not-an-email", password: "123" })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("rejects login without a password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.co" })
    expect(res.status).toBe(400)
  })

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/nope")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ success: false, message: "Route not found" })
  })
})
