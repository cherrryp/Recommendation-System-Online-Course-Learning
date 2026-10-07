import { describe, it, expect, vi, beforeEach } from "vitest"
import request from "supertest"
import { tokenFor } from "./helpers.js"

const users = {
  alice: { id: "alice", role: "student" },
  bob: { id: "bob", role: "student" },
  root: { id: "root", role: "admin" },
}

vi.mock("../src/lib/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(async ({ where }) => users[where.id] ?? null),
      count: vi.fn(async () => 0),
    },
    userInterest: { findMany: vi.fn(async () => []) },
    bookmark: { findMany: vi.fn(async () => []), create: vi.fn() },
  },
}))

const { default: app } = await import("../src/index.js")
const auth = (u) => ({ Authorization: `Bearer ${tokenFor(u)}` })

describe("authentication", () => {
  it("rejects requests without a token", async () => {
    const res = await request(app).get("/api/bookmarks/alice")
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ success: false })
  })

  it("rejects a token for a user that no longer exists", async () => {
    const res = await request(app)
      .get("/api/bookmarks/ghost")
      .set(auth({ id: "ghost", role: "student" }))
    expect(res.status).toBe(401)
  })
})

describe("ownership (requireSelfOrAdmin)", () => {
  it("lets a user read their own bookmarks", async () => {
    const res = await request(app).get("/api/bookmarks/alice").set(auth(users.alice))
    expect(res.status).toBe(200)
  })

  it("blocks a user from reading another user's bookmarks", async () => {
    const res = await request(app).get("/api/bookmarks/bob").set(auth(users.alice))
    expect(res.status).toBe(403)
  })

  it("lets an admin read any user's bookmarks", async () => {
    const res = await request(app).get("/api/bookmarks/bob").set(auth(users.root))
    expect(res.status).toBe(200)
  })

  it("ignores a spoofed userId in the body when toggling a bookmark", async () => {
    const { default: prisma } = await import("../src/lib/prisma.js")
    prisma.bookmark.create.mockResolvedValue({})
    const res = await request(app)
      .post("/api/bookmarks/toggle")
      .set(auth(users.alice))
      .send({ userId: "bob", courseId: "c1" })
    expect(res.status).toBe(200)
    expect(prisma.bookmark.create).toHaveBeenCalledWith({
      data: { userId: "alice", courseId: "c1" },
    })
  })
})

describe("admin routes", () => {
  it("forbids students", async () => {
    const res = await request(app).get("/api/admin/users").set(auth(users.alice))
    expect(res.status).toBe(403)
  })
})
