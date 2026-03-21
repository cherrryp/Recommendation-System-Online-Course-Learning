import { useEffect, useState } from "react"
import { getStats } from "../../api/adminApi"

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = () => {
    setLoading(true)
    setError(null)
    getStats()
      .then(res => {
        console.log(res.data)
        setStats(res.data)
      })
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <div style={centered}>Loading...</div>
  if (error) return (
    <div style={centered}>
      <p style={{ color: "red" }}>{error}</p>
      <button onClick={fetchStats}>Retry</button>
    </div>
  )
  if (!stats) return null

  const statusColor = {
    not_started: "#94a3b8",
    in_progress: "#f59e0b",
    completed: "#16a34a"
  }

  return (
    <div style={{ padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <button onClick={fetchStats} style={refreshBtn}>Refresh</button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
        <StatCard label="Users" value={stats.users} color="#4f46e5" />
        <StatCard label="Courses" value={stats.courses} color="#0891b2" />
        <StatCard label="Enrollments" value={stats.enrollments} color="#16a34a" />
        <StatCard label="Certificates" value={stats.certificates ?? 0} color="#d97706" />
        <StatCard label="Avg Rating" value={`⭐ ${stats.averageRating ?? "0.0"}`} color="#db2777" />
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "32px", flexWrap: "wrap" }}>

        {/* Enrollment Status */}
        <div style={section}>
          <h2 style={sectionTitle}>Enrollment Status</h2>
          {(stats.enrollmentsByStatus ?? []).length === 0
            ? <p style={empty}>No data</p>
            : (stats.enrollmentsByStatus ?? []).map(s => (
                <div key={s.status} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ background: statusColor[s.status] ?? "#ccc", color: "white", padding: "2px 10px", borderRadius: "999px", fontSize: "13px" }}>
                    {s.status.replace("_", " ")}
                  </span>
                  <strong>{s._count.status}</strong>
                </div>
              ))
          }
        </div>

        {/* Top Courses */}
        <div style={section}>
          <h2 style={sectionTitle}>Top 5 Courses</h2>
          {(stats.topCourses ?? []).length === 0
            ? <p style={empty}>No data</p>
            : (stats.topCourses ?? []).map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "14px" }}>#{i + 1} {c.courseName}</span>
                  <strong>{c.enrollments} enrolled</strong>
                </div>
              ))
          }
        </div>

        {/* Recent Users */}
        <div style={{ ...section, flex: 2 }}>
          <h2 style={sectionTitle}>Recent Users</h2>
          {(stats.recentUsers ?? []).length === 0
            ? <p style={empty}>No data</p>
            : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <th style={th}>Email</th>
                    <th style={th}>Role</th>
                    <th style={th}>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentUsers ?? []).map(u => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={td}>{u.email}</td>
                      <td style={td}>
                        <span style={{ background: u.role === "admin" ? "#4f46e5" : "#0891b2", color: "white", padding: "2px 8px", borderRadius: "999px", fontSize: "12px" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          }
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...card, borderTop: `4px solid ${color}` }}>
      <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>{label}</p>
      <h2 style={{ margin: "8px 0 0", color }}>{value}</h2>
    </div>
  )
}

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  minWidth: "150px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
}

const section = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  flex: 1,
  minWidth: "250px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
}

const sectionTitle = { margin: "0 0 16px", fontSize: "16px", color: "#1e293b" }
const centered = { display: "flex", flexDirection: "column", alignItems: "center", marginTop: "50px", gap: "10px" }
const refreshBtn = { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ccc", cursor: "pointer", background: "white" }
const th = { textAlign: "left", padding: "8px", color: "#64748b", fontWeight: "600" }
const td = { padding: "8px", color: "#334155" }
const empty = { color: "#94a3b8", fontSize: "14px", textAlign: "center", marginTop: "20px" }

export default Dashboard