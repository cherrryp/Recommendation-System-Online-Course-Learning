import Navbar from "../../components/Navbar.jsx"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

function Profile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }

    fetch("http://localhost:3000/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user)
          setError(null)
        } else {
          setError(data.message || "Unable to load profile")
        }
      })
      .catch((err) => {
        console.error(err)
        setError("Unable to load profile")
      })
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <div>
      <Navbar />
      <div className="profile-page">
        <h1>Profile</h1>

        {loading && <p>Loading profile...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {user && (
          <div className="profile-card">

            <p>
              <strong>First name:</strong> {user.fname || "-"}
            </p>

            <p>
              <strong>Last name:</strong> {user.lname || "-"}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Education:</strong> {user.educationLevel || "-"}
            </p>

            <p>
              <strong>Birth date:</strong>{" "}
              {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "-"}
            </p>

            <p>
              <strong>Username:</strong> {user.username}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>

            <p>
              <strong>Interests:</strong>{" "}
              {user.interests.length > 0
                ? user.interests.join(", ")
                : "No interests yet"}
            </p>

            <p>
              <strong>Account created:</strong>{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>

          </div>
        )}

      </div>
    </div>
  )
}

export default Profile