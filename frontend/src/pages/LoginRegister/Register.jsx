import { useState } from "react"
import { Link ,useNavigate} from "react-router-dom"
import logo from "../../assets/logo.png"
import "./Login_Register.css"

function Register(){

  const [username,setUsername] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [fname,setFname] = useState("")
  const [lname,setLname] = useState("")
  const [birthDate,setBirthDate] = useState("")
  const [educationLevel,setEducationLevel] = useState("")
  const navigate = useNavigate()

  const handleRegister = async (e)=>{
    e.preventDefault()

    const res = await fetch("http://localhost:3000/api/auth/register",{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        username,
        email,
        password,
        fname,
        lname,
        birthDate: birthDate || null,
        educationLevel: educationLevel || null
      })
    })

    const data = await res.json()

    if(data.success){
        alert("Register success")

        navigate("/login")

      }else{
        alert(data.message)
      }

  }

  return(
    <div className="register">
      <div className="register-container">
        <img src={logo} alt="Login" width={80} height={80}/>
        <h2>Register</h2>
        <form onSubmit={handleRegister}>
          <div className="input-name">
            <div className="name">
            <label htmlFor="fname">First name</label>
            <input
              type="text"
              placeholder="First name"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              required
            />
            </div>
            <div className="name">
            <label htmlFor="lname">Last name</label>
            <input
              type="text"
              placeholder="Last name"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              required
            />
            </div>
          </div>

          <div className="input-name">
            <div className="name">
            <label htmlFor="birthDate">Birth date</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
            </div>
            <div className="name">
            <label htmlFor="educationLevel">Education level</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              required
            >
              <option value="">Please select education level</option>
              <option value="SECONDARY">Lower Secondary School</option>
              <option value="HIGH_SCHOOL">High School</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="BACHELOR">Bachelor's Degree</option>
              <option value="MASTER">Master's Degree</option>
              <option value="DOCTORATE">Doctorate (PhD)</option>
              <option value="OTHER">Other</option>
            </select>
            </div>
          </div>

          <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            required
          />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
          />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
          </div>
          <button type="submit" className="btn-log">
            Register
          </button>
        </form>
      </div>
    </div>
  )
}

export default Register