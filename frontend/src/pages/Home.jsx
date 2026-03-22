import { useEffect, useState } from "react"
import Navbar from "../components/Navbar.jsx"
import Rating from "../components/rating.jsx"
import Footer from "../components/Footer.jsx"
import Content_1 from "../components/Content_1.jsx"
import Content_2 from "../components/content_2.jsx"
import { getRecommendations } from "../api/RecommendationApi"
import { getCourses } from "../api/courseApi"

function Home() {
  const [courses, setCourses] = useState([])

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  useEffect(() => {
    if (userId) {
      // login แล้ว → แสดง recommended
      getRecommendations(userId, 4)
        .then((r) => setCourses(r.data.data || []))
        .catch(() => loadLatest())
    } else {
      // ยังไม่ login → แสดงคอร์สล่าสุด
      loadLatest()
    }
  }, [userId])

  const loadLatest = () => {
    getCourses({ page: 1, limit: 4 })
      .then((r) => setCourses(r.data.courses || []))
      .catch(() => setCourses([]))
  }

  return (
    <div>
      <Navbar />
      <Content_1 />
      <Content_2 courses={courses} isRecommended={!!userId} />
      <Rating />
      <Footer />
    </div>
  )
}

export default Home
