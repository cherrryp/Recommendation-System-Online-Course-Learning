import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar.jsx"
import { getBookmarks } from "../../api/BookmarkApi"
import "./Profile.css"

import { UNI_NAMES } from "../../constants/universities"

// keyword ที่ให้ user เลือกได้
const KEYWORD_OPTIONS = [
  "excel", "python", "programming", "data", "finance", "accounting",
  "business", "management", "english", "language", "health", "nursing",
  "science", "research", "marketing", "law", "education", "agriculture",
  "environment", "technology", "ai", "statistics", "design", "digital",
]

function Profile() {
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [interests, setInterests] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const token = localStorage.getItem("token")
  const storedUser = JSON.parse(localStorage.getItem("user") || "null")
  const userId = storedUser?.id

  useEffect(() => {
    if (!token || !userId) {
      navigate("/login")
      return
    }

    const fetchAll = async () => {
      try {
        // ดึง profile
        const res = await fetch(`http://localhost:3000/api/users/profile/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) {
          setUser(data.data)
          const kws = (data.data.interests || []).map((i) => i.keyword)
          setInterests(kws)
          setSelectedKeywords(kws)
        }

        // ดึง bookmarks
        const bRes = await getBookmarks(userId)
        setBookmarks(bRes.data.data || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [navigate, token, userId])

  const toggleKeyword = (kw) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
    )
  }

  const saveInterests = async () => {
    setSaving(true)
    setSaveMsg("")
    try {
      const res = await fetch(`http://localhost:3000/api/users/interests/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ keywords: selectedKeywords }),
      })
      const data = await res.json()
      if (data.success) {
        setInterests(selectedKeywords)
        setSaveMsg("บันทึกความสนใจแล้ว ✓")
      }
    } catch (err) {
      setSaveMsg("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง")
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(""), 3000)
    }
  }

  if (loading) return <div className="profile"><Navbar /><p style={{ padding: "2rem" }}>กำลังโหลด...</p></div>

  return (
    <div className="profile">
      <Navbar />
      <div className="profile-page">

        {/* ข้อมูลผู้ใช้ */}
        <div className="profile-card">
          <h2>ข้อมูลส่วนตัว</h2>
          {user && (
            <>
              <p><strong>ชื่อ:</strong> {user.fname || "-"} {user.lname || "-"}</p>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>สมัครเมื่อ:</strong> {new Date(user.createdAt).toLocaleDateString("th-TH")}</p>
            </>
          )}
        </div>

        {/* ความสนใจ */}
        <div className="interests-section">
          <h2>ความสนใจของฉัน</h2>
          <p className="hint">เลือก keyword ที่สนใจ ระบบจะแนะนำคอร์สให้ตรงกับคุณมากขึ้น</p>
          <div className="keyword-grid">
            {KEYWORD_OPTIONS.map((kw) => (
              <button
                key={kw}
                className={`keyword-btn ${selectedKeywords.includes(kw) ? "selected" : ""}`}
                onClick={() => toggleKeyword(kw)}
              >
                {kw}
              </button>
            ))}
          </div>
          <div className="save-row">
            <button className="btn-save" onClick={saveInterests} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "บันทึกความสนใจ"}
            </button>
            {saveMsg && <span className="save-msg">{saveMsg}</span>}
          </div>
        </div>

        {/* Bookmarks */}
        <div className="bookmarks-section">
          <h2>คอร์สที่บันทึกไว้ 🔖</h2>
          {bookmarks.length === 0 ? (
            <p>ยังไม่มีคอร์สที่บันทึกไว้</p>
          ) : (
            <div className="cards">
              {bookmarks.map((course) => (
                <a
                  key={course.id}
                  href={course.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="course-card"
                >
                  <div
                    className="image-card"
                    style={{
                      backgroundImage: `url(${course.thumbnailUrl || "/placeholder.png"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="content-card">
                    <h4 className="course-title">{course.title}</h4>
                    <p className="text">{course.category}</p>
                    <p className="text">{UNI_NAMES[course.university] || course.university}</p>
                    <p className="text">{course.price === 0 ? "ฟรี" : `${course.price} บาท`}</p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Profile
