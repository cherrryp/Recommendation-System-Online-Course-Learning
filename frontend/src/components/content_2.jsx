import "./Content_2.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Content_2() {
  const [courses, setCourses] = useState([]);
  
    useEffect(() => {
    fetch("http://localhost:3000/api/courses")
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
    
  return (
    <div className="content-2">
      <h3 className="title">Course Recommendation</h3>
            <div className="cards">
              {courses.slice(0,4).map((course) => (
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
                            ⭐ {course.averageRating ?? "-"} ({course.totalReviews ?? 0} reviews)
                          </p>
                          <p className="text">
                          Categories : {course.category?.name}
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
      <Link to="/course" className="btn-more-card"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ffffffff"><path d="m321-80-71-71 329-329-329-329 71-71 400 400L321-80Z"/></svg>
      <p>View More</p>
      </Link>
    </div>
  );
}
export default Content_2;
