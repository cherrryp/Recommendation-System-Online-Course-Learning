import Navbar from "../../components/Navbar.jsx"
import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { getMyCoursesAPI } from "../../api/enrollmentApi"
import "./Profile.css"

function Profile() {
  const [user, setUser] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [errorProfile, setErrorProfile] = useState(null)
  const navigate = useNavigate()

  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [errorCourses, setErrorCourses] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }

    const fetchData = async () => {
      // 1. ดึงข้อมูล Profile
      try {
        const profileRes = await fetch("http://localhost:3000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        const profileData = await profileRes.json()
        
        if (profileData.success) {
          setUser(profileData.user)
        } else {
          setErrorProfile(profileData.message || "Unable to load profile")
        }
      } catch (err) {
        console.error("Profile fetch error:", err)
        setErrorProfile("Unable to load profile")
      } finally {
        setLoadingProfile(false)
      }

      // 2. ดึงข้อมูลคอร์สเรียนที่ลงทะเบียนไว้
      try {
        const coursesData = await getMyCoursesAPI()
        if (coursesData.success) {
          setCourses(coursesData.data)
        } else {
          setErrorCourses(coursesData.message || "Unable to load courses")
        }
      } catch (err) {
        console.error("Courses fetch error:", err)
        // จัดการ error จาก axios
        setErrorCourses(err.response?.data?.message || err.message || "Unable to load courses")
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchData()
  }, [navigate])

  return (
    <div className="profile">
      <Navbar />
      <div className="profile-page">
        <h1>Profile</h1>

        {/* --- ส่วนแสดงข้อมูลผู้ใช้ --- */}
        {loadingProfile && <p>Loading profile...</p>}
        {errorProfile && <p style={{ color: "red" }}>{errorProfile}</p>}

        {user && (
          <div className="profile-card">
            <p><strong>First name:</strong> {user.fname || "-"}</p>
            <p><strong>Last name:</strong> {user.lname || "-"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Education:</strong> {user.educationLevel || "-"}</p>
            <p><strong>Birth date:</strong> {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : "-"}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p>
              <strong>Interests:</strong>{" "}
              {user.interests?.length > 0 ? user.interests.join(", ") : "No interests yet"}
            </p>
            <p><strong>Account created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        <div className="my-courses-section">
          <h2>My Enrolled Courses 📚</h2>
          <hr className="hr"/>
          {loadingCourses && <p>Loading courses...</p>}
          {errorCourses && <p style={{ color: "red" }}>{errorCourses}</p>}

          {!loadingCourses && !errorCourses && courses.length === 0 && (
            <p>You haven't enrolled in any courses yet. <Link to="/courses">Browse courses</Link></p>
            )}
          
          {courses.length > 0 && (
            <div className="cards">
              {courses.map((enrollment) => (
                <Link 
                  to={`/course/${enrollment.course.id}`} 
                  key={enrollment.id} 
                  className="course-card"
                  style={{ textDecoration: 'none', color: 'inherit' }} // 💡 ป้องกัน Link เปลี่ยนสีข้อความและขีดเส้นใต้
                >
                  <div
                    className="image-card"
                    style={{
                      backgroundImage: `url(${enrollment.course.thumbnailUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  ></div>

                  <div className="content-card">
                    <h4 className="course-title">{enrollment.course.courseName}</h4>

                    <ul className="ul-card">
                      <li>
                        <div className="card-show">
                          <p className="rating">
                            ⭐ {enrollment.course.averageRating ?? "-"} ({enrollment.course.totalReviews ?? 0} reviews)
                          </p>
                          <p className="text">
                          Categories : {enrollment.course.category?.name}
                          </p>
                          <p className="text">
                          Price : {enrollment.course.price === null ? "Free" : `${enrollment.course.price} Baht`}
                          </p>
                        </div>

                        <div className="card-hidden">
                          <p>Level : {enrollment.course.level}</p>
                          {enrollment.course.organization &&
                            <p>Organization : {enrollment.course.organization}</p>
                          }
                          <p>University : {enrollment.course.university}</p>
                        </div>
                      </li>
                    </ul>
                  </div>
              </Link>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile