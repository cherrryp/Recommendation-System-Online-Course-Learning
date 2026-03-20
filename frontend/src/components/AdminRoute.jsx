import { Navigate } from "react-router-dom"

function AdminRoute({ children }) {

  const user = JSON.parse(localStorage.getItem("user"))

  // ยังไม่ได้ login
  if (!user) {
    return <Navigate to="/login" />
  }

  // ไม่ใช่ admin
  if (user.role !== "admin") {
    return <Navigate to="/" />
  }

  // เป็น admin
  return children
}

export default AdminRoute
