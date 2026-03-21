import api from "./api"

export const getStats = () => api.get("/admin/stats")
export const getUserById = (id) => api.get(`/admin/users/${id}`)
export const getUsers = () => api.get("/admin/users")
export const deleteUser = (id) => api.delete(`/admin/users/${id}`)
export const getCourses = () => api.get("/admin/courses")
export const deleteCourse = (id) => api.delete(`/admin/courses/${id}`)