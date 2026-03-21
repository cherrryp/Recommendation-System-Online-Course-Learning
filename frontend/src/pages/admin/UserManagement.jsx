import { useEffect, useState } from "react"
import { getUsers, deleteUser } from "../../api/adminApi"
import { useNavigate } from "react-router-dom"


function UserManagement() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getUsers()
      .then(res => setUsers(res.data))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบ?")) return
    try {
      await deleteUser(id)
      setUsers(users.filter(u => u.id !== id))
    } catch {
      alert("Failed to delete user")
    }
  }

  if (loading) return <div style={centered}>Loading...</div>
  if (error) return <div style={{ ...centered, color: "red" }}>{error}</div>

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ margin: "0 0 24px" }}>User Management</h1>

      {users.length === 0
        ? <p style={empty}>No users found</p>
        : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Joined</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={td}>{user.email}</td>
                  <td style={td}>
                    <span style={{
                      background: user.role === "admin" ? "#4f46e5" : "#0891b2",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontSize: "12px"
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button onClick={() => navigate(`/admin/users/${user.id}`)} style={viewBtn}>View</button>
                    <button onClick={() => handleDelete(user.id)} style={deleteBtn}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }
    </div>
  )
}

const centered = { display: "flex", justifyContent: "center", marginTop: "50px" }
const empty = { color: "#94a3b8", textAlign: "center", marginTop: "20px" }
const th = { textAlign: "left", padding: "10px 8px", color: "#64748b", fontWeight: "600" }
const td = { padding: "10px 8px", color: "#334155" }
const deleteBtn = { padding: "4px 12px", borderRadius: "6px", border: "1px solid #ef4444", color: "#ef4444", cursor: "pointer", background: "white" }
const viewBtn = { padding: "4px 12px", borderRadius: "6px", border: "1px solid #0891b2", color: "#0891b2", cursor: "pointer", background: "white", marginRight: "8px" }

export default UserManagement