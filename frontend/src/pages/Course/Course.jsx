import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import "./Course.css";

function Course() {

  
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [priceFilter, setPriceFilter] = useState("");

  const coursesPerPage = 12;

  // filter
  const filteredCourses = courses.filter(course => {

    const matchCategory =
      !selectedCategory || course.category?.name === selectedCategory;

    const matchUniversity =
      !selectedUniversity || course.university === selectedUniversity;

    const matchPrice =
      !priceFilter ||
      (priceFilter === "free" && course.price === null) ||
      (priceFilter === "paid" && course.price !== null);

    return matchCategory && matchUniversity && matchPrice;
  });

  // pagination
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;

  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // dropdown list
  const categories = [...new Set(courses.map(c => c.category?.name).filter(Boolean))];
  const universities = [...new Set(courses.map(c => c.university).filter(Boolean))];
  useEffect(() => {
    fetch("http://localhost:3000/api/courses")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to fetch courses");
        return data;
      })
      .then((data) => {
        setCourses(Array.isArray(data?.data) ? data.data : []);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setCourses([]);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedUniversity, priceFilter]);

  return (
    <div className="course">
      <Navbar />

        <div className="filter-bar">

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">หมวดหมู่ทั้งหมด</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* University */}
          <select
            value={selectedUniversity}
            onChange={(e) => {
              setSelectedUniversity(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">มหาวิทยาลัยทั้งหมด</option>
            {universities.map((uni) => (
              <option key={uni} value={uni}>{uni ==="CU" ? "จุฬาลงกรณ์มหาวิทยาลัย" : "ไม่มี"}</option>
            ))}
          </select>

          {/* Price */}
          <select
            value={priceFilter}
            onChange={(e) => {
              setPriceFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">ราคาทั้งหมด</option>
            <option value="free">ฟรี</option>
            <option value="paid">เสียเงิน</option>
          </select>
          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedUniversity("");
              setPriceFilter("");
            }}
            className="reset"
          >
          ล้างตัวกรอง
          </button>
        </div>

      <div className="courseAll">
      {currentCourses.length === 0 ? (
        <div className="no-course">
          ไม่มีคอร์สที่ตรงกับเงื่อนไข
        </div>
      ) : (
          currentCourses.map((course) => (
          <Link to={`/course/${course.id}`} className="card-all" key={course.id}>

            <div
              className="image-card-all"
              style={{
                backgroundImage: `url(${course.thumbnailUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            />

            <div className="content-card-all">

              <h4 className="course-title">{course.courseName}</h4>

              <ul className="ul-card">
                <li>

                  <div className="card-show">
                    <p className="rating">
                      ⭐ {course.averageRating ?? 0} ({course.totalReviews ?? 0} reviews)
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
        ))
      )}
      </div>


      {/* pagination */}
      <div className="pagination">

        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <span>Page {currentPage} / {totalPages}</span>

        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>

      </div>

    </div>
  );
}

export default Course;