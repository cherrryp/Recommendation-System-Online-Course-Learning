import { UNI_NAMES } from "../constants/universities"
import "./CourseCard.css"

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

function CourseCard({ course, bookmarked, onBookmark, onOpen, variant = "grid" }) {
  const fallbackImg = UNI_HOVER_IMAGES[course.university]
  const displayImg = encodeImg(course.thumbnailUrl) || fallbackImg

  // variant="grid" → Course.jsx, variant="scroll" → Content_2.jsx
  const cardClass = variant === "scroll" ? "scroll-card" : "card-all"
  const imgClass = variant === "scroll" ? "scroll-card-img" : "image-card-all"
  const bodyClass = variant === "scroll" ? "scroll-card-body" : "content-card-all"
  const titleClass = variant === "scroll" ? "scroll-card-title" : "course-title"
  const badgesClass = variant === "scroll" ? "scroll-card-badges" : "card-badges"
  const footerClass = variant === "scroll" ? "scroll-card-footer" : "card-footer"

  return (
    <div
      className={cardClass}
      onClick={() => onOpen(course)}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => {
        const imgEl = e.currentTarget.querySelector(`.${imgClass}`)
        if (fallbackImg && imgEl) imgEl.style.backgroundImage = `url(${fallbackImg})`
      }}
      onMouseLeave={(e) => {
        const imgEl = e.currentTarget.querySelector(`.${imgClass}`)
        if (imgEl) imgEl.style.backgroundImage = displayImg ? `url(${displayImg})` : "none"
      }}
    >
      <div
        className={imgClass}
        style={{
          backgroundImage: displayImg ? `url(${displayImg})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "#e9ecef",
          transition: "all 0.3s ease",
        }}
      />
      <div className={bodyClass}>
        <h4 className={titleClass}>{course.title}</h4>

        {/* แถวบน */}
        <div className="card-meta">
            <div className="meta-row">
                <span className="badge badge-category">
                {course.category}
                </span>
            </div>

            <div className="meta-row">
                <span className="badge badge-uni">
                {UNI_NAMES[course.university] || course.university || "-"}
                </span>
            </div>
        </div>

        {/* แถวล่าง */}
        <div className={footerClass}>
            
            {/* ซ้าย */}
            <span className={`badge ${course.status === "open" ? "badge-open" : "badge-closed"}`}>
                {course.status === "open" ? "กำลังเปิด" : "ปิดอยู่"}
            </span>

            {/* ขวา */}
            <div className="card-actions">
                <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
                {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
                </span>

                <button
                    className={`btn-bookmark ${bookmarked ? "bookmarked" : ""}`}
                    onClick={(e) => {
                        e.stopPropagation()
                        onBookmark(course.id)
                    }}
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill={bookmarked ? "#6c63ff" : "none"}
                        stroke={bookmarked ? "#6c63ff" : "#aaa"}
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
      
    </div>
  )
}

export default CourseCard