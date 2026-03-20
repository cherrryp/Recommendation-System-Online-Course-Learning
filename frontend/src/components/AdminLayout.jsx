import { Link, Outlet } from "react-router-dom"

function AdminLayout() {

  return (

    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Sidebar */}
      <div style={{
        width: "240px",
        background: "#111827",
        color: "white",
        padding: "20px"
      }}>

        <h2>Admin Panel</h2>

        <div style={{ marginTop: "30px", display: "flex", flexDirection: "column", gap: "15px" }}>

          <Link to="/admin/dashboard">Dashboard</Link>

          <Link to="/admin/users">User Management</Link>

          <Link to="/admin/courses">Course Management</Link>

        </div>

      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: "30px", background: "#f3f4f6" }}>
        <Outlet />
      </div>

    </div>

  )

}

export default AdminLayout