import { useEffect, useState } from "react"
import { getStats } from "../../api/adminApi"
import "./Dashboard.css"
import "./Admin.css"

const UNI_NAMES = {
  CU: "จุฬาฯ", CMU: "เชียงใหม่", KKU: "ขอนแก่น",
  KU: "เกษตรฯ", MJU: "แม่โจ้", KMITL: "ลาดกระบัง",
  PSU: "สงขลาฯ", TU: "ธรรมศาสตร์", HU: "หาดใหญ่",
  NU: "นเรศวร", RMU: "ราชภัฏมหาสารคาม", SRU: "ราชภัฏสุราษฎร์ฯ",
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="stat-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ color }}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
      <p className="stat-label">{label}</p>
      <h2 className="stat-value" style={{ color }}>{value}</h2>
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = () => {
    setLoading(true)
    setError(null)
    getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => setError("โหลดข้อมูลไม่ได้"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <div className="dash-center"><p>กำลังโหลด...</p></div>
  if (error) return <div className="dash-center"><p style={{ color: "red" }}>{error}</p><button onClick={fetchStats}>ลองใหม่</button></div>
  if (!stats) return null

  const actionColor = { click: "#6c63ff", bookmark: "#f59e0b", search: "#0891b2" }
  const maxUni = Math.max(...(stats.universityStats?.map((u) => u._count.university) || [1]))
  const maxCat = Math.max(...(stats.categoryStats?.map((c) => c._count.category) || [1]))

  return (
    <div className="dashboard">
      <div className="dash-header">
        <h1>Dashboard</h1>
        <button onClick={fetchStats} className="btn-refresh">↻ Refresh</button>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        <StatCard label="ผู้ใช้ทั้งหมด" value={stats.users} color="#6c63ff"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>' />
        <StatCard label="คอร์สทั้งหมด" value={stats.courses} color="#0891b2"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .65.73.45.75.45C2.2 20.9 4.15 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.65 0 .5-.6.5-.65V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>' />
        <StatCard label="Interactions" value={stats.interactions} color="#16a34a"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>' />
        <StatCard label="Bookmarks" value={stats.bookmarks} color="#f59e0b"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>' />
        <StatCard label="Active users (7 วัน)" value={stats.activeUsers} color="#db2777"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17v5c5.05-.56 9-4.78 9-9.98 0-5.42-3.94-9.96-9-10.97zM11 2.06C5.95 3.07 2 7.61 2 13c0 5.2 3.95 9.43 9 9.99v-2.02c-3.95-.49-7-3.86-7-7.97 0-3.21 1.8-6.01 4.72-7.28L11 7V2.06z"/></svg>' />
        <StatCard label="Embedding coverage" value={`${stats.embeddingCoverage?.covered}/${stats.embeddingCoverage?.total}`} color="#7c3aed"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>' />
        <StatCard label="คอร์สฟรี" value={stats.freeCourses} color="#16a34a"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>' />
        <StatCard label="คอร์สเสียเงิน" value={stats.paidCourses} color="#c2410c"
          icon='<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>' />
      </div>

      <div className="dash-grid">

        {/* Interaction by action */}
        <div className="dash-section">
          <h2>Interaction ตาม action</h2>
          {stats.interactionsByAction?.map((item) => (
            <div key={item.action} className="row-item">
              <span className="badge-action" style={{ background: actionColor[item.action] || "#ccc" }}>
                {item.action}
              </span>
              <strong>{item._count.action}</strong>
            </div>
          ))}
        </div>

        {/* Top keywords */}
        <div className="dash-section">
          <h2>Interest keywords ยอดนิยม</h2>
          {stats.topKeywords?.length === 0
            ? <p className="empty">ยังไม่มีข้อมูล</p>
            : <div className="keyword-cloud">
              {stats.topKeywords?.map((k) => (
                <span key={k.keyword} className="keyword-tag"
                  style={{ fontSize: `${Math.max(11, Math.min(18, 11 + (k._sum.score / 5)))}px` }}>
                  {k.keyword}
                </span>
              ))}
            </div>
          }
        </div>

        {/* Interaction trend */}
        <div className="dash-section">
          <h2>Interaction 7 วันล่าสุด</h2>
          {stats.interactionTrend?.length === 0
            ? <p className="empty">ยังไม่มีข้อมูล</p>
            : <div className="trend-bars">
              {stats.interactionTrend?.map((t) => {
                const maxTrend = Math.max(...stats.interactionTrend.map((x) => x.count))
                const pct = Math.round((t.count / maxTrend) * 100)
                return (
                  <div key={t.date} className="trend-bar-item">
                    <div className="trend-bar-wrap">
                      <div className="trend-bar-fill" style={{ height: `${pct}%` }} />
                    </div>
                    <span className="trend-date">{t.date.slice(5)}</span>
                    <span className="trend-count">{t.count}</span>
                  </div>
                )
              })}
            </div>
          }
        </div>

        {/* University distribution */}
        <div className="dash-section">
          <h2>คอร์สตามมหาวิทยาลัย</h2>
          {stats.universityStats?.map((u) => (
            <div key={u.university} className="bar-item">
              <span className="bar-label">{UNI_NAMES[u.university] || u.university}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round((u._count.university / maxUni) * 100)}%`, background: "#6c63ff" }} />
              </div>
              <span className="bar-count">{u._count.university}</span>
            </div>
          ))}
        </div>

        {/* Category distribution */}
        <div className="dash-section">
          <h2>หมวดหมู่คอร์ส</h2>
          {stats.categoryStats?.map((c) => (
            <div key={c.category} className="bar-item">
              <span className="bar-label">{c.category}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${Math.round((c._count.category / maxCat) * 100)}%`, background: "#0891b2" }} />
              </div>
              <span className="bar-count">{c._count.category}</span>
            </div>
          ))}
        </div>

        {/* Top courses */}
        <div className="dash-section">
          <h2>Top 5 คอร์สยอดนิยม</h2>
          {stats.topCourses?.length === 0
            ? <p className="empty">ยังไม่มีข้อมูล</p>
            : stats.topCourses?.map((c, i) => (
              <div key={i} className="row-item">
                <span className="rank">#{i + 1}</span>
                <span className="course-name">{c.title}</span>
                <strong>{c.count}</strong>
              </div>
            ))
          }
          <h2 style={{ marginTop: "20px" }}>Top 5 Bookmark</h2>
          {stats.topBookmarkedCourses?.length === 0
            ? <p className="empty">ยังไม่มีข้อมูล</p>
            : stats.topBookmarkedCourses?.map((c, i) => (
              <div key={i} className="row-item">
                <span className="rank">#{i + 1}</span>
                <span className="course-name">{c.title}</span>
                <strong>{c.count}</strong>
              </div>
            ))
          }
        </div>

        {/* Recent users */}
        <div className="dash-section wide">
          <h2>ผู้ใช้ล่าสุด</h2>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>สมัครเมื่อ</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers?.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.username}</td>
                  <td>
                    <span className="badge-role" style={{ background: u.role === "admin" ? "#6c63ff" : "#0891b2" }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString("th-TH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
