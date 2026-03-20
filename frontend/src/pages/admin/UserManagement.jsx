import { useEffect, useState } from "react"
import { getUsers, deleteUser } from "../../api/adminApi"

function UserManagement() {

  const [users, setUsers] = useState([])

  useEffect(() => {

    getUsers().then(res => {
      setUsers(res.data)
    })

  }, [])

  const handleDelete = async (id) => {

    await deleteUser(id)

    setUsers(users.filter(u => u.id !== id))

  }

  return (

    <div>

      <h1>User Management</h1>

      <table border="1" cellPadding="10">

        <thead>

          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>

        </thead>

        <tbody>

          {users.map(user => (

            <tr key={user.id}>

              <td>{user.email}</td>
              <td>{user.role}</td>

              <td>

                <button onClick={() => handleDelete(user.id)}>
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

export default UserManagement