import Navbar from "../components/Navbar.jsx"
import Footer from "../components/Footer.jsx"
import Content_1 from "../components/Content_1.jsx";
import Content_2 from "../components/Content_2.jsx";
import Rating from "../components/Rating.jsx";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

function Home() {
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/courses/popular")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch courses");
        return data;
      })
      .then((data) => {
        setCourses(Array.isArray(data?.data) ? data.data : []); // data จาก backend
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setCourses([]);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    fetch("http://localhost:3000/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch profile");
        return data;
      })
      .then((data) => {
        if (data.success && data.user) setUser(data.user)
      })
      .catch((err) => console.error("Failed to load profile:", err))
  }, [])
  
  return (
    <div>
        <Navbar />
        <Content_1 />
        <div className="content-3">
          <h3 className="title">Popular Course</h3>
          
            <div className="cards">
              {courses.map((course) => (
                <Link to={`/course/${course.id}`} className="card" key={course.id}>
                  <div
                    className="image-card"
                    style={{
                      backgroundImage: `url(${course.thumbnailUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  ></div>

                  <div className="content-card">
                    <h4 className="course-title">{course.courseName}</h4>

                    <ul className="ul-card">
                      <li>
                        <div className="card-show">
                          <p className="rating">
                            ⭐ {course.averageRating} ({course.totalReviews} reviews)
                          </p>
                          <p className="text">
                          Categories : {course.category.name}
                          </p>
                          <p className="text">
                          Price : {course.price === null ? "Free" : `${course.price} Baht`}
                          </p>
                        </div>

                        <div className="card-hidden">
                          <p>Level : {course.level}</p>
                          {course.organization &&
                            <p>Organization : {course.organization}</p>
                          }
                          <p>University : {course.university}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </Link>
              ))}
            </div>
        </div>
        <Content_2 />
        <Rating />
        <Footer />
    </div>
  )
}
export default Home