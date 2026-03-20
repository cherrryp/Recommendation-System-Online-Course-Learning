import { useEffect, useState } from "react"
import { getStats } from "../../api/adminApi"

function Dashboard() {

  const [stats, setStats] = useState(null)

  useEffect(() => {

    getStats().then(res => {
      setStats(res.data)
    })

  }, [])

  if (!stats) return <div>Loading...</div>

  return (

    <div>

      <h1>Dashboard</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

        <div style={card}>
          <h3>Users</h3>
          <h2>{stats.users}</h2>
        </div>

        <div style={card}>
          <h3>Courses</h3>
          <h2>{stats.courses}</h2>
        </div>

        <div style={card}>
          <h3>Enrollments</h3>
          <h2>{stats.enrollments}</h2>
        </div>

      </div>

    </div>

  )

}

const card = {
  background: "white",
  padding: "20px",
  borderRadius: "10px",
  width: "200px",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
}

export default Dashboard