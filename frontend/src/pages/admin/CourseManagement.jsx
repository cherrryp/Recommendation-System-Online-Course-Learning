import { useEffect, useState } from "react"
import { getCourses, deleteCourse } from "../../api/adminApi"

const PAGE_SIZE = 20

function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [filterLevel, setFilterLevel] = useState("")
  const [filterPrice, setFilterPrice] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCourses()
      .then(res => setCourses(res.data))
      .catch(() => setError("Failed to load courses"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบคอร์ส?")) return
    try {
      await deleteCourse(id)
      setCourses(courses.filter(c => c.id !== id))
    } catch {
      alert("Failed to delete course")
    }
  }

  const categories = [...new Set(courses.map(c => c.category?.name).filter(Boolean))]

  const filtered = courses.filter(c => {
    const matchSearch = c.courseName.toLowerCase().includes(search.toLowerCase())
    const matchLevel = filterLevel ? c.level === filterLevel : true
    const matchPrice = filterPrice === "free" ? !c.price || c.price === 0
      : filterPrice === "paid" ? c.price > 0 : true
    const matchCategory = filterCategory ? c.category?.name === filterCategory : true
    return matchSearch && matchLevel && matchPrice && matchCategory
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // reset page เมื่อ filter เปลี่ยน
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  if (loading) return <div style={centered}>Loading...</div>
  if (error) return <div style={{ ...centered, color: "red" }}>{error}</div>

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ margin: "0 0 24px" }}>Course Management</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={handleFilterChange(setSearch)}
          style={input}
        />
        <select value={filterCategory} onChange={handleFilterChange(setFilterCategory)} style={input}>
          <option value="">All Categories</option>
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select value={filterLevel} onChange={handleFilterChange(setFilterLevel)} style={input}>
          <option value="">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={filterPrice} onChange={handleFilterChange(setFilterPrice)} style={input}>
          <option value="">All Prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        {(search || filterLevel || filterPrice || filterCategory) &&
          <button onClick={() => { setSearch(""); setFilterLevel(""); setFilterPrice(""); setFilterCategory(""); setPage(1) }} style={clearBtn}>
            ✕ Clear
          </button>
        }
      </div>

      <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 12px" }}>
        แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} คอร์ส
      </p>

      {filtered.length === 0
        ? <p style={empty}>No courses found</p>
        : <>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={th}>Course Name</th>
                  <th style={th}>Category</th>
                  <th style={th}>Level</th>
                  <th style={th}>Price</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(course => (
                  <tr key={course.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={td}>{course.courseName}</td>
                    <td style={td}>{course.category?.name ?? "-"}</td>
                    <td style={td}>
                      <span style={{
                        background: levelColor[course.level] ?? "#ccc",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "12px"
                      }}>
                        {course.level}
                      </span>
                    </td>
                    <td style={td}>{course.price ? `฿${course.price}` : "Free"}</td>
                    <td style={td}>
                      <button onClick={() => handleDelete(course.id)} style={deleteBtn}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "20px" }}>
              <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtn(page === 1)}>«</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} style={pageBtn(page === 1)}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push("...")
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === "..."
                  ? <span key={`dot-${i}`} style={{ padding: "0 4px" }}>...</span>
                  : <button key={p} onClick={() => setPage(p)} style={pageBtn(false, p === page)}>{p}</button>
                )
              }
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} style={pageBtn(page === totalPages)}>›</button>
              <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtn(page === totalPages)}>»</button>
            </div>
          </>
      }
    </div>
  )
}

const levelColor = {
  beginner: "#16a34a",
  intermediate: "#f59e0b",
  advanced: "#ef4444"
}

const centered = { display: "flex", justifyContent: "center", marginTop: "50px" }
const empty = { color: "#94a3b8", textAlign: "center", marginTop: "20px" }
const th = { textAlign: "left", padding: "10px 8px", color: "#64748b", fontWeight: "600" }
const td = { padding: "10px 8px", color: "#334155" }
const input = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none" }
const deleteBtn = { padding: "4px 12px", borderRadius: "6px", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer", background: "white" }
const clearBtn = { padding: "8px 12px", borderRadius: "8px", border: "1px solid #ccc", cursor: "pointer", background: "white", color: "#64748b" }
const pageBtn = (disabled, active = false) => ({
  padding: "6px 12px",
  borderRadius: "6px",
  border: `1px solid ${active ? "#4f46e5" : "#e2e8f0"}`,
  background: active ? "#4f46e5" : "white",
  color: active ? "white" : disabled ? "#cbd5e1" : "#334155",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: "14px"
})

export default CourseManagement