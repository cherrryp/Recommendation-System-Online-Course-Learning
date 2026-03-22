import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import logo from "../../assets/logo.png"
import "./Register.css"

function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fname, setFname] = useState("")
  const [lname, setLname] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, fname, lname }),
    })
    const data = await res.json()
    if (data.success) {
      alert("สมัครสมาชิกสำเร็จ")
      navigate("/login")
    } else {
      alert(data.message)
    }
  }

  return (
    <div className="register">
      <div className="register-container">
        <img src={logo} alt="Login" width={80} height={80} />
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="input-name">
            <div className="name">
              <label>First name</label>
              <input type="text" placeholder="First name" value={fname}
                onChange={(e) => setFname(e.target.value)} required />
            </div>
            <div className="name">
              <label>Last name</label>
              <input type="text" placeholder="Last name" value={lname}
                onChange={(e) => setLname(e.target.value)} required />
            </div>
          </div>
          <div className="input-group">
            <label>Username</label>
            <input type="text" placeholder="Username" value={username}
              onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-log">Register</button>
        </form>
        <p>มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link></p>
      </div>
    </div>
  )
}

export default Register
