import axios from "axios"
// import { api } from "./api"

//Config deployment URL
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  // URL for deplotment
  baseURL: `${API_URL}/api`
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

