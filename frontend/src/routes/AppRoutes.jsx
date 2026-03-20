import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from "../pages/Home"
import AboutUs from "../pages/AboutUs/AboutUs"
import Login from "../pages/LoginRegister/Login"
import Register from "../pages/LoginRegister/Register"
import Profile from "../pages/Profile/Profile"
import Course from "../pages/Course/Course"
import CourseDetail from "../pages/CourseDetail/CourseDetail"

import AdminLayout from "../components/AdminLayout"
import AdminRoute from "../components/AdminRoute"

import Dashboard from "../pages/admin/Dashboard"
import UserManagement from "../pages/admin/UserManagement"
import CourseManagement from "../pages/admin/CourseManagement"

function AppRoutes() {

  return (

    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/:id" element={<CourseDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/register" element={<Register />} />

        {/* ADMIN */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >

          <Route index element={<Dashboard />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="courses" element={<CourseManagement />} />

        </Route>

      </Routes>

    </BrowserRouter>

  )

}

export default AppRoutes