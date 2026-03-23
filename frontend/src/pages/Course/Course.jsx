import { useState, useEffect } from "react"
import Navbar from "../../components/Navbar"
import { getCourses, getCategories, getUniversities } from "../../api/courseApi"
import { toggleBookmark, getBookmarks } from "../../api/BookmarkApi"
import { getRecommendations } from "../../api/RecommendationApi"
import { recordInteraction } from "../../api/interactionApi"
import { UNI_NAMES } from "../../constants/universities"
import "./Course.css"
import { useBookmark } from "../../context/BookmarkContext"

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

const encodeImg = (url) => {
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

function CourseCard({ course, bookmarked, onBookmark, onOpen }) {
  const fallbackImg = UNI_HOVER_IMAGES[course.university]
  const displayImg = encodeImg(course.thumbnailUrl) || fallbackImg

  const handleOpen = (url) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      className="card-all"
      onClick={() => handleOpen(course.url)}
      style={{ cursor: "pointer" }}
      onMouseEnter={(e) => {
        const imgEl = e.currentTarget.querySelector(".image-card-all")
        if (fallbackImg && imgEl) {
          imgEl.style.backgroundImage = `url(${fallbackImg})`
        }
      }}
      onMouseLeave={(e) => {
        const imgEl = e.currentTarget.querySelector(".image-card-all")
        if (imgEl) {
          imgEl.style.backgroundImage = displayImg ? `url(${displayImg})` : "none"
        }
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
            className={`btn-bookmark ${bookmarked ? "bookmarked" : ""}`}
            onClick={(e) => {
              e.stopPropagation()
              onBookmark(course.id)
            }}
            title={bookmarked ? "ยกเลิก bookmark" : "บันทึก"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
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
  )
}

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
    if (userId) recordInteraction({ userId, courseId: course.id, action: "click" }).catch(() => {})
    window.open(course.url, "_blank", "noopener,noreferrer")
  }

  const handleBookmark = async (courseId) => {
    const bookmarked = await toggle(courseId)

    if (bookmarked) {
      recordInteraction({ userId, courseId, action: "bookmark" }).catch(() => {})
    }
  }

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput) }

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
