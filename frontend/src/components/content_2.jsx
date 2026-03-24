import "./Content_2.css"
import { Link } from "react-router-dom"
import { UNI_NAMES } from "../constants/universities"
import { useBookmark } from "../context/BookmarkContext"
import { recordInteraction } from "../api/interactionApi"

export const UNI_HOVER_IMAGES = {
  Chulalongkorn: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/563000010687901_iw03ss.jpg",
  CMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/unnamed_bguhc3.png",
  KKU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774249715/KKU_SLA_Logo.svg_yzfddp.png",
  HU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/logo_B_taoe7z.png",
  KMITL: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/KMITL_Sublogo.svg_svlwi2.png",
  KU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/png-clipart-kasetsart-university-national-pingtung-university-of-science-and-technology-king-mongkut-s-university-of-technology-thonburi-student-student-thumbnail_ewqzaa.png",
  MJU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248858/MJU_LOGO_nbczak.svg",
  NU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/NULOGO-EN_y4g3de.png",
  PSU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_emjhsc.png",
  RMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_1_f701zp.png",
  SRU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo-sru-png_neqczi.png",
  TU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo01_ooeuuf.jpg",
}

export const encodeImg = (url) => {
  if (!url) return null
  try {
    const u = new URL(url)
    u.pathname = u.pathname
      .split("/")
      .map((seg) => encodeURIComponent(decodeURIComponent(seg)))
      .join("/")
    return u.toString()
  } catch {
    return null
  }
}

function Content_2({ courses = [], title = "คอร์สล่าสุด" }) {
  const { bookmarks, toggle } = useBookmark()
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  const handleOpen = (course) => {
    if (userId) recordInteraction(userId, course.id, "click").catch(() => {})
    window.open(course.url, "_blank", "noopener,noreferrer")
  }

  const handleBookmark = (e, courseId) => {
    e.stopPropagation()
    if (userId) recordInteraction(userId, courseId, "bookmark").catch(() => {})
    toggle(courseId)
  }

  return (
    <div className="content-2">
      {/* Header row */}
      <div className="section-header">
        <h3 className="section-title">
          { title }
        </h3>
        <Link to="/course" className="btn-see-all">
          ดูทั้งหมด
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
            <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/>
          </svg>
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="cards-wrapper">
  
        <div className="cards-scroll">
          {courses.length === 0 ? (
            <p className="loading-text">กำลังโหลด...</p>
          ) : (
            courses.map((course) => {
              const fallbackImg = UNI_HOVER_IMAGES[course.university]
              const displayImg = encodeImg(course.thumbnailUrl) || fallbackImg
              const isBookmarked = bookmarks.has(course.id)

              return (
                <div
                  className="scroll-card"
                  key={course.id}
                  onClick={() => handleOpen(course)}
                >
                  <div
                    className="scroll-card-img"
                    style={{
                      backgroundImage: displayImg ? `url(${displayImg})` : "none",
                      backgroundColor: "#e9ecef",
                    }}
                    onMouseEnter={(e) => {
                      if (fallbackImg) e.currentTarget.style.backgroundImage = `url(${fallbackImg})`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundImage = displayImg ? `url(${displayImg})` : "none"
                    }}
                  />
                  <div className="scroll-card-body">
                    <h4 className="scroll-card-title">{course.title}</h4>
                    <div className="scroll-card-badges">
                      <span className="badge badge-category">{course.category}</span>
                      <span className="badge badge-uni">{UNI_NAMES[course.university] || course.university || "-"}</span>
                    </div>
                    <div className="scroll-card-footer">
                      <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
                        {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
                      </span>
                      <button
                        className={`btn-bookmark ${isBookmarked ? "bookmarked" : ""}`}
                        onClick={(e) => handleBookmark(e, course.id)}
                        title={isBookmarked ? "ยกเลิก bookmark" : "บันทึก"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                          fill={isBookmarked ? "#6c63ff" : "none"}
                          stroke={isBookmarked ? "#6c63ff" : "#aaa"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Content_2