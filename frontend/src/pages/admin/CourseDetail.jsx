import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getCourseById, updateCourse } from "../../api/adminApi"

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: "", description: "", price: 0,
    category: "", status: "open",
  })

  useEffect(() => {
    getCourseById(id)
      .then((res) => {
        const c = res.data.data  
        setCourse(c)
        setForm({
          title: c.title ?? "",
          description: c.description ?? "",
          price: c.price ?? 0,
          category: c.category ?? "",
          status: c.status ?? "open",
        })
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false))
  }, [id])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateCourse(id, form)
      setSuccess(true)
    } catch {
      alert("Failed to update course")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={centered}>Loading...</div>
  if (error) return <div style={{ ...centered, color: "red" }}>{error}</div>
  if (!course) return null

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
        <h1 style={{ margin: 0 }}>แก้ไขคอร์ส</h1>
      </div>

      <div style={card}>
        <h2 style={sectionTitle}>ข้อมูลคอร์ส</h2>
        <div style={grid}>
          <div>
            <label style={labelStyle}>ชื่อคอร์ส</label>
            <input name="title" value={form.title} onChange={handleChange} style={input} />
          </div>
          <div>
            <label style={labelStyle}>หมวดหมู่</label>
            <input name="category" value={form.category} onChange={handleChange} style={input} />
          </div>
          <div>
            <label style={labelStyle}>ราคา (฿)</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} style={input} />
          </div>
          <div>
            <label style={labelStyle}>สถานะ</label>
            <select name="status" value={form.status} onChange={handleChange} style={input}>
              <option value="open">เปิด</option>
              <option value="closed">ปิด</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange}
            rows={5} style={{ ...input, width: "100%", resize: "vertical", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <button onClick={handleSave} disabled={saving} style={saveBtn}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {success && <span style={{ color: "#16a34a", fontSize: "14px" }}>✓ Saved!</span>}
        </div>
      </div>

      <div style={{ ...card, marginTop: "20px" }}>
        <h2 style={sectionTitle}>ข้อมูลเพิ่มเติม</h2>
        <div style={grid}>
          <InfoRow label="University" value={course.university ?? "-"} />
          <InfoRow label="Instructor" value={course.instructor ?? "-"} />
          <InfoRow label="Keywords" value={course.keywords?.map(k => k.keyword).join(", ") || "-"} />
          <InfoRow label="Created At" value={new Date(course.createdAt).toLocaleDateString("th-TH")} />
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase" }}>{label}</p>
      <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{value}</div>
    </div>
  )
}

const card = { background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }
const sectionTitle = { margin: "0 0 16px", fontSize: "16px", color: "#1e293b" }
const centered = { display: "flex", justifyContent: "center", marginTop: "50px" }
const labelStyle = { display: "block", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "6px" }
const input = { width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", boxSizing: "border-box" }
const backBtn = { padding: "6px 14px", borderRadius: "8px", border: "1px solid #ccc", cursor: "pointer", background: "white" }
const saveBtn = { padding: "8px 20px", borderRadius: "8px", border: "none", background: "#4f46e5", color: "white", cursor: "pointer", fontSize: "14px" }

export default CourseDetail