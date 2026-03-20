import { useEffect, useState } from "react"
import { getCourses, deleteCourse } from "../../api/adminApi"

function CourseManagement() {

  const [courses, setCourses] = useState([])

  useEffect(() => {

    getCourses().then(res => {
      setCourses(res.data)
    })

  }, [])

  const handleDelete = async (id) => {

    await deleteCourse(id)

    setCourses(courses.filter(c => c.id !== id))

  }

  return (

    <div>

      <h1>Course Management</h1>

      <table border="1" cellPadding="10">

        <thead>

          <tr>
            <th>Title</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {courses.map(course => (

            <tr key={course.id}>

              <td>{course.title}</td>

              <td>

                <button onClick={() => handleDelete(course.id)}>
                  Delete
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  )

}

export default CourseManagement