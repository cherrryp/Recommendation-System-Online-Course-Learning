import "./Login_Register.css";
import logo from "../../assets/logo.png";
import { useState } from "react";
import { Link ,useNavigate} from "react-router-dom";

function Login() {

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const navigate = useNavigate()


  const handleLogin = async (e) => {
    e.preventDefault()

    try{
      const res = await fetch("http://localhost:3000/api/auth/login",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          email,
          password
        })
      })

      const data = await res.json()

      if(data.success){
      alert("Login success")

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      if(data.user.role === "admin"){
        navigate("/admin/dashboard")
      }else{
        navigate("/")
      }
    }else{
        alert(data.message)
      }

    }catch(err){
      console.log(err)
    }
  }

  return (
    <div className="login">
      <div className="login-container">
        <img src={logo} alt="Login" width={80} height={80}/>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          </div>
          <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          </div>
          <div className="btn-LogReg">
          <button className="btn-log" type="submit">
            Login
          </button>
          <Link to="/register" className="btn-reg">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;