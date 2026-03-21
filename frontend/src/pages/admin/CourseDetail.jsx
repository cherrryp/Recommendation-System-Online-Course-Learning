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
    courseName: "",
    level: "",
    price: "",
    courseDescription: ""
  })

  useEffect(() => {
    getCourseById(id)
      .then(res => {
        setCourse(res.data)
        setForm({
          courseName: res.data.courseName ?? "",
          level: res.data.level ?? "",
          price: res.data.price ?? "",
          courseDescription: res.data.courseDescription ?? ""
        })
      })
      .catch(() => setError("Failed to load course"))
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

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
        <h1 style={{ margin: 0 }}>Course Detail</h1>
      </div>

      {/* Info */}
      <div style={card}>
        <h2 style={sectionTitle}>ข้อมูลคอร์ส</h2>

        <div style={grid}>
          <div>
            <label style={labelStyle}>Course Name</label>
            <input name="courseName" value={form.courseName} onChange={handleChange} style={input} />
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <select name="level" value={form.level} onChange={handleChange} style={input}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Price (฿)</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} style={input} placeholder="0 = Free" />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <input value={course.category?.name ?? "-"} disabled style={{ ...input, background: "#f8fafc", color: "#94a3b8" }} />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label style={labelStyle}>Description</label>
          <textarea
            name="courseDescription"
            value={form.courseDescription}
            onChange={handleChange}
            rows={5}
            style={{ ...input, width: "100%", resize: "vertical", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
          <button onClick={handleSave} disabled={saving} style={saveBtn}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {success && <span style={{ color: "#16a34a", fontSize: "14px" }}>✓ Saved!</span>}
        </div>
      </div>

      {/* Read-only info */}
      <div style={{ ...card, marginTop: "20px" }}>
        <h2 style={sectionTitle}>ข้อมูลเพิ่มเติม</h2>
        <div style={grid}>
          <InfoRow label="Organization" value={course.organization ?? "-"} />
          <InfoRow label="University" value={course.university ?? "-"} />
          <InfoRow label="Target Group" value={course.targetGroup ?? "-"} />
          <InfoRow label="Created At" value={new Date(course.createdAt).toLocaleDateString()} />
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