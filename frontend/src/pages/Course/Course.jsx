import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import { getCourses, getCategories, getUniversities } from "../../api/courseApi"
import { toggleBookmark, getBookmarks } from "../../api/BookmarkApi"
import { getRecommendations } from "../../api/RecommendationApi"
import { recordInteraction } from "../../api/interactionApi"
import { UNI_NAMES } from "../../constants/universities"
import "./Course.css"
import { useBookmark } from "../../context/BookmarkContext"
import CourseCard from "../../components/CourseCard"

function Course() {
  const [courses, setCourses] = useState([])
  const [recommended, setRecommended] = useState([])
  const [categories, setCategories] = useState([])
  const [universities, setUniversities] = useState([])
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
  
  const { bookmarks, toggle } = useBookmark()

  useEffect(() => {
    getCategories().then((r) => setCategories(r.data.data || []))
    getUniversities().then((r) => setUniversities(r.data.data || []))
  }, [])

  useEffect(() => {
    if (!userId) return
    getRecommendations(userId, 6).then((r) => setRecommended(r.data.data || []))
  }, [userId])

  useEffect(() => {
    setLoading(true)
    const params = {
      search, category: selectedCategory, university: selectedUniversity,
      page: currentPage, limit: coursesPerPage,
      ...(priceFilter === "free" && { maxPrice: 0 }),
      ...(priceFilter === "paid" && { minPrice: 1 }),
    }
    getCourses(params)
        .then((r) => { setCourses(r.data.courses || []); setTotalPages(r.data.totalPages || 1) })
        .catch(() => setCourses([]))
        .finally(() => setLoading(false))
  }, [search, selectedCategory, selectedUniversity, priceFilter, currentPage])

  useEffect(() => { setCurrentPage(1) }, [search, selectedCategory, selectedUniversity, priceFilter])

  const handleOpen = (course) => {
    if (userId) recordInteraction(userId, course.id, "click").catch(() => {})
    window.open(course.url, "_blank", "noopener,noreferrer")
  }

  const handleBookmark = async (courseId) => {
    const bookmarked = await toggle(courseId)
    if (bookmarked && userId) {
      recordInteraction(userId, courseId, "bookmark").catch(() => {})
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    if (userId && searchInput.trim()) {
      recordInteraction(userId, null, "search", searchInput.trim()).catch(() => {})
    }
  }

  const resetFilters = () => {
    setSearch(""); setSearchInput("")
    setSelectedCategory(""); setSelectedUniversity(""); setPriceFilter("")
  }

  return (
    <div className="course">
      <Navbar />

      {/* {recommended.length > 0 && (
        <div className="recommended-section">
          <h3>แนะนำสำหรับคุณ</h3>
          <div className="courseAll recommended">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} bookmarked={bookmarks.has(c.id)}
                onBookmark={handleBookmark} onOpen={handleOpen} />
            ))}
          </div>
        </div>
      )} */}

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
