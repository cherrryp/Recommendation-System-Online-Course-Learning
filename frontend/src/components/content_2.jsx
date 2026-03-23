import "./Content_2.css"
import { Link } from "react-router-dom"
import { UNI_NAMES } from "../constants/universities"

function Content_2({ courses = [], isRecommended = false }) {
  const handleOpen = (url) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="content-2">
      <h3 className="title">
        {isRecommended ? "แนะนำสำหรับคุณ ✨" : "คอร์สล่าสุด"}
      </h3>

      <div className="cards">
        {courses.length === 0 ? (
          <p style={{ color: "#888", padding: "20px 0" }}>กำลังโหลด...</p>
        ) : (
          courses.map((course) => (
            <div
              className="card"
              key={course.id}
              onClick={() => handleOpen(course.url)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="image-card"
                style={{
                  backgroundImage: course.thumbnailUrl
                    ? `url(${course.thumbnailUrl})`
                    : "none",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#e9ecef",
                }}
              />
              <div className="content-card">
                <h4 className="course-title">{course.title}</h4>
                <div className="card-badges">
                  <span className="badge badge-category">{course.category}</span>
                  <span className="badge badge-uni">
                    {UNI_NAMES[course.university] || course.university || "-"}
                  </span>
                </div>
                <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
                  {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
                </span>
              </div>
            </div>
          ))
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
