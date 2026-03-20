import { useState, useEffect } from "react";
import { useParams, Link , useNavigate } from "react-router-dom";
import { getCourseById } from "../../api/courseApi";
import Navbar from "../../components/Navbar";
import "./CourseDetail.css";
import { enrollCourse , getMyCoursesAPI } from "../../api/enrollmentApi";

function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function loadCourseData() {
      setLoading(true);
      setError(null);

      try {
        const resCourse = await getCourseById(id);

        if (!resCourse.data.success) {
          throw new Error(resCourse.data.message);
        }

        const courseData = resCourse.data.data;
        setCourse(courseData);

        // 🔥 เช็ค enroll
        try {
          const myCourses = await getMyCoursesAPI();

          if (myCourses.success) {
            const found = myCourses.data.find(
              (enroll) =>
                String(enroll.courseId) === String(courseData.id)
            );

            setIsEnrolled(!!found);
          }
        } catch (err) {
          console.log("Check enroll error:", err);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCourseData();
  }, [id]);

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      const res = await enrollCourse(course.id);

      if (!res.success) {
        throw new Error(res.message);
      }

      alert("Enroll success 🎉");
      setIsEnrolled(true);

    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      alert(msg);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="detail">
      <Navbar />

        <div style={{ padding: "1rem" }} className="detail-container">
            {loading && <p>Loading course...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}
            {course && (
            <div className="detail-course">
                <div className="de-imgandcontent">
                    <div className="de-img">
                        <img src={course.thumbnailUrl || "https://res.cloudinary.com/dygjtp2be/image/upload/v1774030276/%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E_cga0pm.jpg" } alt="" className="img-course"
                        onError={(e) => {
                          e.target.src = "https://res.cloudinary.com/dygjtp2be/image/upload/v1774030276/%E0%B9%84%E0%B8%A1%E0%B9%88%E0%B8%A1%E0%B8%B5%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%A0%E0%B8%B2%E0%B8%9E_cga0pm.jpg";
                        }} 
                        />
                    </div>
                    <div className="de-content">
                        <h2>{course.courseName}</h2>
                        <p><strong>รายละเอียด : </strong>{course.courseDescription}</p>
                        <p>
                        <strong>Category : </strong> {course.category}
                        </p>
                        <p>
                        <strong>Level : </strong> {course.level}
                        </p>
                        <p>
                        <strong>Price : </strong>{" "}
                        {course.price === 0 ? "Free" : `${course.price} Baht`}
                        </p>
                        {course.organization && (
                        <p>
                            <strong>Organization : </strong> {course.organization}
                        </p>
                        )}
                        {isEnrolled ? (
                          <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "8px", border: "1px solid #ddd" }}>
                            <h3 style={{ color: "#2c3e50", marginBottom: "10px" }}>คุณลงทะเบียนคอร์สนี้แล้ว ✅</h3>
                            <button 
                              onClick={() => navigate(`/learn/${course.id}`)}
                              style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginRight: "10px" }}
                            >
                              เข้าสู่บทเรียน
                            </button>
                            <button 
                              onClick={() => navigate(`/tests/${course.id}`)} // ตัวอย่างลิงก์ไปหน้าทำข้อสอบ
                              style={{ padding: "10px 20px", backgroundColor: "#f39c12", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                            >
                              📝 ทำข้อสอบ
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={handleEnroll}
                            disabled={enrolling}
                            style={{ marginTop: "1rem", padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            {enrolling ? "Enrolling..." : "Enroll Now"}
                          </button>
                        )}
                    </div>

                </div>

                <div className="module">
                    {course.modules?.length > 0 && (
                    <div>
                        <h3>Modules</h3>
                        <ul>
                        {course.modules
                            .sort((a, b) => a.orderIndex - b.orderIndex)
                            .map((module) => (
                            <li key={module.id}>
                                {module.orderIndex}. {module.moduleName}
                            </li>
                            ))}
                        </ul>
                    </div>
                    )}
                </div>
            </div>
            )}
        </div>
    </div>
  );
}

export default CourseDetail;
