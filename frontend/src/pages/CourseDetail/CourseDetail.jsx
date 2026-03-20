import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getCourseById } from "../../api/courseApi";
import Navbar from "../../components/Navbar";
import "./CourseDetail.css";

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError(null);

      try {
        const res = await getCourseById(id);
        if (!res.success) {
          throw new Error(res.message || "Failed to load course");
        }
        setCourse(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [id]);

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
                        <img src={course.thumbnailUrl || "../assets/content-rating.png" } alt="" />
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
