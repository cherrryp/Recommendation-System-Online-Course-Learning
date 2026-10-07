import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUserInterests,
  setUserInterests,
} from "../service/user.service.js"
import asyncHandler from "../utils/asyncHandler.js"
import HttpError from "../utils/HttpError.js"

// GET /api/users/profile/:userId
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getUserProfile(req.params.userId)
  if (!profile) throw new HttpError(404, "User not found")
  res.json({ success: true, data: profile })
})

// PUT /api/users/profile/:userId
export const updateProfile = asyncHandler(async (req, res) => {
  const { fname, lname, username } = req.body
  const updated = await updateUserProfile(req.params.userId, { fname, lname, username })
  res.json({ success: true, data: updated })
})

// PUT /api/users/password/:userId
export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  await updatePassword(req.params.userId, { oldPassword, newPassword })
  res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" })
})

// GET /api/users/interests/:userId
export const getInterests = asyncHandler(async (req, res) => {
  const interests = await getUserInterests(req.params.userId)
  res.json({ success: true, data: interests })
})

// PUT /api/users/interests/:userId
// body: { keywords: ["excel", "python", "finance"] }
export const updateInterests = asyncHandler(async (req, res) => {
  const { keywords } = req.body
  if (!Array.isArray(keywords)) throw new HttpError(400, "keywords must be array")
  const interests = await setUserInterests(req.params.userId, keywords)
  res.json({ success: true, data: interests })
})
