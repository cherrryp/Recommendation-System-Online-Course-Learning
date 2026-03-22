import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getUserInterests,
  setUserInterests,
} from "../service/user.service.js"

// GET /api/users/profile/:userId
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const profile = await getUserProfile(userId)
    if (!profile) return res.status(404).json({ success: false, message: "User not found" })
    res.json({ success: true, data: profile })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting profile" })
  }
}

// PUT /api/users/profile/:userId
export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const { fname, lname, username } = req.body
    const updated = await updateUserProfile(userId, { fname, lname, username })
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error updating profile" })
  }
}

// PUT /api/users/password/:userId
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params
    const { oldPassword, newPassword } = req.body
    await updatePassword(userId, { oldPassword, newPassword })
    res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จ" })
  } catch (error) {
    console.error(error)
    res.status(400).json({ success: false, message: error.message })
  }
}

// GET /api/users/interests/:userId
export const getInterests = async (req, res) => {
  try {
    const { userId } = req.params
    const interests = await getUserInterests(userId)
    res.json({ success: true, data: interests })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error getting interests" })
  }
}

// PUT /api/users/interests/:userId
// body: { keywords: ["excel", "python", "finance"] }
export const updateInterests = async (req, res) => {
  try {
    const { userId } = req.params
    const { keywords } = req.body
    if (!Array.isArray(keywords)) {
      return res.status(400).json({ success: false, message: "keywords must be array" })
    }
    const interests = await setUserInterests(userId, keywords)
    res.json({ success: true, data: interests })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, message: "Error updating interests" })
  }
}
