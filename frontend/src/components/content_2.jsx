import "./Content_2.css"
import { Link } from "react-router-dom"
import { useBookmark } from "../context/BookmarkContext"
import { recordInteraction } from "../api/interactionApi"
import CourseCard from "../components/CourseCard"

function Content_2({ courses = [], title = "คอร์สล่าสุด" }) {
  const { bookmarks, toggle } = useBookmark()
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  const handleOpen = (course) => {
    if (userId) recordInteraction(userId, course.id, "click").catch(() => {})
    window.open(course.url, "_blank", "noopener,noreferrer")
  }

  const handleBookmark = (courseId) => {
    if (userId) recordInteraction(userId, courseId, "bookmark").catch(() => {})
    toggle(courseId)
  }

  return (
    <div className="content-2">
      <div className="section-header">
        <h3 className="section-title">{title}</h3>
        <Link to="/course" className="btn-see-all">
          ดูทั้งหมด
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 -960 960 960" fill="currentColor">
            <path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/>
          </svg>
        </Link>
      </div>

      <div className="cards-wrapper">
        <div className="cards-scroll">
          {courses.length === 0 ? (
            <p className="loading-text">กำลังโหลด...</p>
          ) : (
            courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                variant="scroll"
                bookmarked={bookmarks.has(course.id)}
                onBookmark={handleBookmark}
                onOpen={handleOpen}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Content_2