import { UNI_NAMES } from "../constants/universities"

const UNI_HOVER_IMAGES = {
  Chulalongkorn: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/563000010687901_iw03ss.jpg",
  CMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/unnamed_bguhc3.png",
  KKU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774249715/KKU_SLA_Logo.svg_yzfddp.png",
  HU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774250735/ChatGPT_Image_Mar_23_2026_02_25_12_PM_h68py4.png",
  KMITL: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/KMITL_Sublogo.svg_svlwi2.png",
  KU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/png-clipart-kasetsart-university-national-pingtung-university-of-science-and-technology-king-mongkut-s-university-of-technology-thonburi-student-student-thumbnail_ewqzaa.png",
  MJU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248858/MJU_LOGO_nbczak.svg",
  NU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/NULOGO-EN_y4g3de.png",
  PSU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_emjhsc.png",
  RMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_1_f701zp.png",
  SRU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo-sru-png_neqczi.png",
  TU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo01_ooeuuf.jpg",
}

export default function MiniCard({ course, bookmarked, onBookmark }) {
  const fallbackImg = UNI_HOVER_IMAGES[course.university]
  const displayImg = course.thumbnailUrl || fallbackImg

  return (
    <div className="mini-card">
      <a href={course.url} target="_blank" rel="noopener noreferrer" className="mini-card-link">
        <div
          className="mini-card-img"
          style={{
            backgroundImage: displayImg ? `url(${displayImg})` : "none",
            backgroundColor: "#e9ecef",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="mini-card-info">
          <p className="mini-card-title">{course.title}</p>
          <p className="mini-card-uni">
            {UNI_NAMES[course.university] || course.university || "-"}
          </p>
          <span className={`price-badge ${!course.price || course.price === 0 ? "free" : "paid"}`}>
            {!course.price || course.price === 0 ? "ฟรี" : `${course.price} ฿`}
          </span>
        </div>
      </a>
      {onBookmark && (
        <button
          className={`mini-bookmark ${bookmarked ? "bookmarked" : ""}`}
          onClick={() => onBookmark(course.id)}
          title={bookmarked ? "ยกเลิก bookmark" : "บันทึก"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={bookmarked ? "#6c63ff" : "none"}
            stroke={bookmarked ? "#6c63ff" : "#aaa"} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  )
}
