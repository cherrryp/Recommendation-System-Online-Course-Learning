import { useEffect, useState } from "react"
import Navbar from "../components/Navbar.jsx"
import Rating from "../components/rating.jsx"
import Footer from "../components/Footer.jsx"
import Content_1 from "../components/Content_1.jsx"
import Content_2 from "../components/content_2.jsx"
import { getRecommendations } from "../api/RecommendationApi"
import { getCourses, getPopularCourses } from "../api/courseApi"

function Home() {
  const [recommended, setRecommended] = useState([])
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

    // recommended เฉพาะตอน login
    if (userId) {
      getRecommendations(userId, 8)
        .then((r) => setRecommended(r.data.data || []))
        .catch(() => {})
    }
  }, [userId])

  return (
    <div>
      <Navbar />
      <Content_1 />
      {userId && recommended.length > 0 && (
        <Content_2 courses={recommended} title="แนะนำสำหรับคุณ" />
      )}
      <Content_2 courses={popular} title="คอร์สยอดนิยม" />
      <Content_2 courses={latest} title="คอร์สล่าสุด" />
      <Rating />
      <Footer />
    </div>
  )
}

export default Home