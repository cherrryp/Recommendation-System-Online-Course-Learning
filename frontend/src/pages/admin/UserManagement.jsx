import { useEffect, useState } from "react"
import { getUsers, deleteUser } from "../../api/adminApi"
import { useNavigate } from "react-router-dom"
import "./Admin.css"

function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    getUsers()
      .then((res) => setUsers(res.data.data || []))
      .catch(() => setError("โหลดข้อมูลไม่ได้"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบ user นี้?")) return
    try {
      await deleteUser(id)
      setUsers(users.filter((u) => u.id !== id))
    } catch {
      alert("ลบไม่ได้")
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="admin-center"><p>กำลังโหลด...</p></div>
  if (error) return <div className="admin-center"><p style={{ color: "red" }}>{error}</p></div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>User Management</h1>
        <span className="admin-badge">{users.length} users</span>
      </div>

      <input
        className="admin-search"
        type="text"
        placeholder="ค้นหา email หรือ username..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="admin-empty">ไม่พบผู้ใช้</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Interactions</th>
                <th>Bookmarks</th>
                <th>สมัครเมื่อ</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.username || "-"}</td>
                  <td>
                    <span className="badge-role" style={{ background: user.role === "admin" ? "#6c63ff" : "#0891b2" }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user._count?.interactions ?? 0}</td>
                  <td>{user._count?.bookmarks ?? 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString("th-TH")}</td>
                  <td>
                    <button className="btn-view" onClick={() => navigate(`/admin/users/${user.id}`)}>ดู</button>
                    <button className="btn-delete" onClick={() => handleDelete(user.id)}>ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default UserManagement
