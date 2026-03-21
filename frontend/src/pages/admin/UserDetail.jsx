import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getUserById } from "../../api/adminApi"

function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getUserById(id)
      .then(res => setUser(res.data))
      .catch(() => setError("Failed to load user"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={centered}>Loading...</div>
  if (error) return <div style={{ ...centered, color: "red" }}>{error}</div>
  if (!user) return null

  return (
    <div style={{ padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button onClick={() => navigate(-1)} style={backBtn}>← Back</button>
        <h1 style={{ margin: 0 }}>User Detail</h1>
      </div>

      {/* Info Card */}
      <div style={card}>
        <h2 style={sectionTitle}>ข้อมูลทั่วไป</h2>
        <div style={grid}>
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Username" value={user.username ?? "-"} />
          <InfoRow label="ชื่อ" value={`${user.fname ?? ""} ${user.lname ?? ""}`.trim() || "-"} />
          <InfoRow label="Role" value={
            <span style={{
              background: user.role === "admin" ? "#4f46e5" : "#0891b2",
              color: "white",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "12px"
            }}>
              {user.role}
            </span>
          } />
          <InfoRow label="Education" value={user.educationLevel ?? "-"} />
          <InfoRow label="วันเกิด" value={user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "-"} />
          <InfoRow label="สมัครเมื่อ" value={new Date(user.createdAt).toLocaleDateString()} />
        </div>
      </div>

      {/* Interests */}
      <div style={{ ...card, marginTop: "20px" }}>
        <h2 style={sectionTitle}>ความสนใจ</h2>
        {user.interests.length === 0
          ? <p style={empty}>ไม่มีข้อมูลความสนใจ</p>
          : <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {user.interests.map(i => (
                <span key={i.keyword} style={tag}>{i.keyword}</span>
              ))}
            </div>
        }
      </div>

    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: "0", padding: "12px", background: "#f8fafc", borderRadius: "8px" }}>
      <p style={{ margin: "0 0 4px", fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <div style={{ fontSize: "14px", color: "#1e293b", fontWeight: "500" }}>{value}</div>
    </div>
  )
}

const card = { background: "white", padding: "24px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.08)" }
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }
const sectionTitle = { margin: "0 0 16px", fontSize: "16px", color: "#1e293b" }
const centered = { display: "flex", justifyContent: "center", marginTop: "50px" }
const empty = { color: "#94a3b8", fontSize: "14px" }
const tag = { background: "#e0e7ff", color: "#4f46e5", padding: "4px 12px", borderRadius: "999px", fontSize: "13px" }
const backBtn = { padding: "6px 14px", borderRadius: "8px", border: "1px solid #ccc", cursor: "pointer", background: "white" }

export default UserDetail