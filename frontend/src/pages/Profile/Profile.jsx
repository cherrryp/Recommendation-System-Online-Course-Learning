import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Navbar from "../../components/Navbar.jsx"
import { getBookmarks, toggleBookmark } from "../../api/BookmarkApi"
import "./Profile.css"
import {UNI_HOVER_IMAGES, encodeImg} from "../../components/content_2.jsx"

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
          <h2>คอร์สที่บันทึกไว้</h2>
          {bookmarks.length === 0 ? (
            <p>ยังไม่มีคอร์สที่บันทึกไว้</p>
          ) : (
            <div className="cards">
              {bookmarks.map((course) => {
                const fallbackImg = UNI_HOVER_IMAGES[course.university]
                const displayImg = encodeImg(course.thumbnailUrl) || fallbackImg

                return (
                  <div
                    className="card-all"
                    key={course.id}
                    onClick={() => window.open(course.url, "_blank", "noopener,noreferrer")}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(e) => {
                      const imgEl = e.currentTarget.querySelector(".image-card-all")
                      if (fallbackImg && imgEl) imgEl.style.backgroundImage = `url(${fallbackImg})`
                    }}
                    onMouseLeave={(e) => {
                      const imgEl = e.currentTarget.querySelector(".image-card-all")
                      if (imgEl) imgEl.style.backgroundImage = displayImg ? `url(${displayImg})` : "none"
                    }}
                  >
                    <div
                      className="image-card-all"
                      style={{
                        backgroundImage: displayImg ? `url(${displayImg})` : "none",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundColor: "#e9ecef",
                        transition: "all 0.3s ease",
                      }}
                    />
                    <div className="content-card-all">
                      <h4 className="course-title">{course.title}</h4>
                      <div className="card-badges">
                        <span className="badge badge-category">{course.category}</span>
                        <span className="badge badge-uni">
                          {UNI_NAMES[course.university] || course.university || "-"}
                        </span>
                      </div>
                      <div className="card-footer">
                        <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
                          {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
                        </span>
                        <button
                          className="btn-bookmark bookmarked"
                          onClick={async (e) => {
                            e.stopPropagation()
                            const res = await toggleBookmark(userId, course.id)
                            if (!res.data.bookmarked) {
                              await toggle(course.id)
                              setBookmarks((prev) => prev.filter((c) => c.id !== course.id))
                            }
                          }}
                          title="ยกเลิก bookmark"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16" height="16"
                            viewBox="0 0 24 24"
                            fill="#6c63ff"
                            stroke="#6c63ff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Profile
