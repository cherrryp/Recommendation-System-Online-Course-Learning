import { Link, Outlet, useLocation } from "react-router-dom"
import "./AdminLayout.css"

function AdminLayout() {
  const { pathname } = useLocation()

  const navItems = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/users", label: "User Management" },
    { to: "/admin/courses", label: "Course Management" },
  ]

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <h2>Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`admin-nav-item ${pathname === item.to ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: "8px", verticalAlign: "middle" }}>
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            กลับหน้าเว็บ
          </Link>
        </div>
      </div>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
