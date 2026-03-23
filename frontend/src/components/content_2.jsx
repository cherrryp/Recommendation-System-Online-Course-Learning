import "./Content_2.css"
import { Link } from "react-router-dom"
import { UNI_NAMES } from "../constants/universities"

import { useState, useEffect } from "react"
import { toggleBookmark, getBookmarks } from "../api/BookmarkApi"
import { useBookmark } from "../context/BookmarkContext"

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

// const encodeImg = (url) => url ? encodeURI(url) : null

function Content_2({ courses = [], isRecommended = false }) {
  const { bookmarks, toggle } = useBookmark()

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  const handleBookmark = (e, courseId) => {
    e.stopPropagation()
    toggle(courseId)
  }

  const handleOpen = (url) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="content-2">
      <h3 className="title">
        {isRecommended ? "แนะนำสำหรับคุณ" : "คอร์สล่าสุด"}
      </h3>

      <div className="cards">
        {courses.length === 0 ? (
          <p style={{ color: "#888", padding: "20px 0" }}>กำลังโหลด...</p>
        ) : (
          courses.map((course) => {
            const fallbackImg = UNI_HOVER_IMAGES[course.university]
            const displayImg = encodeImg(course.thumbnailUrl) || fallbackImg
            const isBookmarked = bookmarks.has(course.id)

            return (
              <div
                className="card-all"
                key={course.id}
                onClick={() => handleOpen(course.url)}
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

                    {/* ปุ่ม bookmark */}
                    <button
                      className={`btn-bookmark ${isBookmarked ? "bookmarked" : ""}`}
                      onClick={(e) => handleBookmark(e, course.id)}
                      title={isBookmarked ? "ยกเลิก bookmark" : "บันทึก"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16" height="16"
                        viewBox="0 0 24 24"
                        fill={isBookmarked ? "#6c63ff" : "none"}
                        stroke={isBookmarked ? "#6c63ff" : "#aaa"}
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
          })
        )}
      </div>

      <Link to="/course" className="btn-more-card">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#fff">
          <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z" />
        </svg>
        <p>ดูคอร์สทั้งหมด</p>
      </Link>
    </div>
  )
}

export default Content_2