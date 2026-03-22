import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import { getCourses, getCategories, getUniversities } from "../../api/courseApi"
import { toggleBookmark, getBookmarks } from "../../api/BookmarkApi"
import { getRecommendations } from "../../api/RecommendationApi"
import { recordInteraction } from "../../api/interactionApi"
import { UNI_NAMES } from "../../constants/universities"
import "./Course.css"

function CourseCard({ course, bookmarked, onBookmark, onOpen }) {
  return (
    <div className="card-all" onClick={() => onOpen(course)}>
      <div
        className="image-card-all"
        style={{ backgroundImage: course.thumbnailUrl ? `url(${course.thumbnailUrl})` : "none" }}
      />
      <div className="content-card-all">
        <h4 className="course-title">{course.title}</h4>
        <div className="card-badges">
          <span className="badge badge-category">{course.category}</span>
          <span className="badge badge-uni">{UNI_NAMES[course.university] || course.university || "-"}</span>
        </div>
        <div className="card-footer">
          <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
            {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
          </span>
          <button
            className={`btn-bookmark ${bookmarked ? "bookmarked" : ""}`}
            onClick={(e) => { e.stopPropagation(); onBookmark(course.id) }}
            title={bookmarked ? "ยกเลิก bookmark" : "บันทึก"}
          >
            {bookmarked ? "🔖" : "📌"}
          </button>
        </div>
      </div>
    </div>
  )
}

function Course() {
  const [courses, setCourses] = useState([])
  const [recommended, setRecommended] = useState([])
  const [categories, setCategories] = useState([])
  const [universities, setUniversities] = useState([])
  const [bookmarks, setBookmarks] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [priceFilter, setPriceFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const coursesPerPage = 12

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data || []))
    getUniversities().then((r) => setUniversities(r.data.data || []))
  }, [])

  useEffect(() => {
    if (!userId) return
    getBookmarks(userId).then((r) => {
      setBookmarks(new Set((r.data.data || []).map((c) => c.id)))
    })
  }, [userId])

  useEffect(() => {
    if (!userId) return
    getRecommendations(userId, 6).then((r) => setRecommended(r.data.data || []))
  }, [userId])

  useEffect(() => {
    setLoading(true)
    getCourses({
      search, category: selectedCategory, university: selectedUniversity,
      page: currentPage, limit: coursesPerPage,
      ...(priceFilter === "free" && { maxPrice: 0 }),
      ...(priceFilter === "paid" && { minPrice: 1 }),
    })
      .then((r) => { setCourses(r.data.courses || []); setTotalPages(r.data.totalPages || 1) })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false))
  }, [search, selectedCategory, selectedUniversity, priceFilter, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search, selectedCategory, selectedUniversity, priceFilter])

  const handleOpen = (course) => {
    if (userId) recordInteraction({ userId, courseId: course.id, action: "click" }).catch(() => {})
    window.open(course.url, "_blank", "noopener,noreferrer")
  }

  const handleBookmark = async (courseId) => {
    if (!userId) return alert("กรุณาเข้าสู่ระบบก่อน")
    const res = await toggleBookmark(userId, courseId)
    const { bookmarked } = res.data
    setBookmarks((prev) => {
      const next = new Set(prev)
      bookmarked ? next.add(courseId) : next.delete(courseId)
      return next
    })
    if (bookmarked) recordInteraction({ userId, courseId, action: "bookmark" }).catch(() => {})
  }

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput) }

  const resetFilters = () => {
    setSearch(""); setSearchInput("")
    setSelectedCategory(""); setSelectedUniversity(""); setPriceFilter("")
  }

  return (
    <div className="course">
      <Navbar />

      {recommended.length > 0 && (
        <div className="recommended-section">
          <h3>แนะนำสำหรับคุณ ✨</h3>
          <div className="courseAll recommended">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} bookmarked={bookmarks.has(c.id)}
                onBookmark={handleBookmark} onOpen={handleOpen} />
            ))}
          </div>
        </div>
      )}

      <form className="search-bar" onSubmit={handleSearch}>
        <input type="text" placeholder="ค้นหาคอร์ส..." value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} />
        <button type="submit">ค้นหา</button>
      </form>

      <div className="filter-bar">
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">หมวดหมู่ทั้งหมด</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)}>
          <option value="">มหาวิทยาลัยทั้งหมด</option>
          {universities.map((uni) => <option key={uni} value={uni}>{UNI_NAMES[uni] || uni}</option>)}
        </select>
        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
          <option value="">ราคาทั้งหมด</option>
          <option value="free">ฟรี</option>
          <option value="paid">เสียเงิน</option>
        </select>
        <button onClick={resetFilters} className="reset">ล้างตัวกรอง</button>
      </div>

      {loading ? (
        <div className="loading">กำลังโหลด...</div>
      ) : courses.length === 0 ? (
        <div className="no-course">ไม่มีคอร์สที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="courseAll">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} bookmarked={bookmarks.has(c.id)}
              onBookmark={handleBookmark} onOpen={handleOpen} />
          ))}
        </div>
      )}

      <div className="pagination">
        <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>Previous</button>
        <span>หน้า {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  )
}

export default Course
