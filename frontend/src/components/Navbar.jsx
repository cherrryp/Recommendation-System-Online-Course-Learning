import "./Navbar.css"
import Logo from "../assets/logo.png"
import { Link } from "react-router-dom"  
import { useState, useEffect, useRef } from "react"

function Navbar() {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user") || "null")
  const [openMenu, setOpenMenu] = useState(false)
  const menuRef = useRef()

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/"
  }

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setOpenMenu(false)
    }
  }
  document.addEventListener("mousedown", handleClickOutside)
  return () => document.removeEventListener("mousedown", handleClickOutside)
}, [])

return (
    <div className="menu">
      <Link to="/" className="logo">
          <img src={Logo} alt="Logo" width={45}/>
          <p className="logo-text">LearningPath</p>
      </Link>
      
      <div className="menu-r">
        <ul className="menu-ul">
            <li><Link to="/" className="menu-a">Home</Link></li>
            <li><Link to="/course" className="menu-a">Course</Link></li>
            <li className="btn-lr">
            {token && user ? (
              <div className="account-menu" ref={menuRef}>
                <button 
                  className={`account-btn3 ${openMenu ? "active" : ""}`}
                  onClick={() => setOpenMenu(!openMenu)}
                >
                  {user.username} {openMenu ? "▲" : "▼"}
                </button>

                {openMenu && (
                  <div className="dropdown-menu">
                    {user.role === "admin" && (
                      <Link to="/admin/dashboard" className="dropdown-item">
                        Dashboard
                      </Link>
                    )}
                    <Link to="/profile" className="dropdown-item">
                      Profile
                    </Link>
                    <div className="divider"></div> 
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="account-btn">Login</Link>
                <Link to="/register" className="account-btn2">Register</Link>
              </>
            )}
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Navbar;
