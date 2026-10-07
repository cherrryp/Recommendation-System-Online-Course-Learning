import { useEffect, useState } from "react"
import Navbar from "../components/Navbar.jsx"
import Rating from "../components/Rating.jsx"
import Footer from "../components/Footer.jsx"
import Content_1 from "../components/Content_1.jsx"
import Content_2 from "../components/Content_2.jsx"
import { getHomeRows } from "../api/RecommendationApi"
import { getCourses, getPopularCourses } from "../api/courseApi"

function Home() {
  const [rows, setRows] = useState([])
  const [popular, setPopular] = useState([])
  const [latest, setLatest] = useState([])

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  useEffect(() => {
    // popular ดึงเสมอ
    getPopularCourses(8).then((r) => setPopular(r.data.data || []))

    // latest ดึงเสมอ
    getCourses({ page: 1, limit: 8 })
      .then((r) => setLatest(r.data.courses || []))
      .catch(() => {})

    // แถวแนะนำเฉพาะตอน login (แนะนำสำหรับคุณ / เพราะคุณสนใจ / กำลังมาแรง / ลองสิ่งใหม่)
    if (userId) {
      getHomeRows(userId)
        .then((r) => setRows(r.data.data || []))
        .catch(() => {})
    }
  }, [userId])

  return (
    <div>
      <Navbar />
      <Content_1 />
      {userId && rows.length > 0
        ? rows.map((row) => <Content_2 key={row.id} courses={row.courses} title={row.title} />)
        : <Content_2 courses={popular} title="คอร์สยอดนิยม" />}
      <Content_2 courses={latest} title="คอร์สล่าสุด" />
      <Rating />
      <Footer />
    </div>
  )
}

export default Home
