import { useEffect, useState } from "react"
import { getCourses, deleteCourse } from "../../api/adminApi"
import { useNavigate } from "react-router-dom"
import "./Admin.css"

const PAGE_SIZE = 20

function CourseManagement() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [filterPrice, setFilterPrice] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.data.data || []))
      .catch(() => setError("โหลดข้อมูลไม่ได้"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบคอร์สนี้?")) return
    try {
      await deleteCourse(id)
      setCourses(courses.filter((c) => c.id !== id))
    } catch {
      alert("ลบไม่ได้")
    }
  }

  const categories = [...new Set(courses.map((c) => c.category).filter(Boolean))]

  const filtered = courses.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = filterCategory ? c.category === filterCategory : true
    const matchPrice = filterPrice === "free" ? c.price === 0
      : filterPrice === "paid" ? c.price > 0 : true
    return matchSearch && matchCategory && matchPrice
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetFilters = () => { setSearch(""); setFilterCategory(""); setFilterPrice(""); setPage(1) }

  if (loading) return <div className="admin-center"><p>กำลังโหลด...</p></div>
  if (error) return <div className="admin-center"><p style={{ color: "red" }}>{error}</p></div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Course Management</h1>
        <span className="admin-badge">{courses.length} คอร์ส</span>
      </div>

      <div className="admin-filters">
        <input className="admin-search" type="text" placeholder="ค้นหาชื่อคอร์ส..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1) }}>
          <option value="">หมวดหมู่ทั้งหมด</option>
          {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filterPrice} onChange={(e) => { setFilterPrice(e.target.value); setPage(1) }}>
          <option value="">ราคาทั้งหมด</option>
          <option value="free">ฟรี</option>
          <option value="paid">เสียเงิน</option>
        </select>
        {(search || filterCategory || filterPrice) && (
          <button className="btn-clear-filter" onClick={resetFilters}>✕ ล้าง</button>
        )}
      </div>

      <p className="admin-count">
        แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} คอร์ส
      </p>

      {filtered.length === 0 ? (
        <p className="admin-empty">ไม่พบคอร์ส</p>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ชื่อคอร์ส</th>
                  <th>หมวดหมู่</th>
                  <th>มหาวิทยาลัย</th>
                  <th>ราคา</th>
                  <th>Interactions</th>
                  <th>Bookmarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((course) => (
                  <tr key={course.id}>
                    <td className="td-title">{course.title}</td>
                    <td><span className="badge-category">{course.category}</span></td>
                    <td>{course.university || "-"}</td>
                    <td>
                      <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
                        {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
                      </span>
                    </td>
                    <td>{course._count?.interactions ?? 0}</td>
                    <td>{course._count?.bookmarks ?? 0}</td>
                    <td>
                      <button className="btn-view" onClick={() => navigate(`/admin/courses/${course.id}`)}>แก้ไข</button>
                      <button className="btn-delete" onClick={() => handleDelete(course.id)}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="admin-pagination">
            <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push("...")
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === "..." ? <span key={`dot-${i}`}>...</span>
                  : <button key={p} onClick={() => setPage(p)} className={p === page ? "active" : ""}>{p}</button>
              )}
            <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        </>
      )}
    </div>
  )
}

export default CourseManagement
