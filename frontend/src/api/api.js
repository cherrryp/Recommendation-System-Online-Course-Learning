import axios from "axios"
// import { api } from "./api"

const api = axios.create({
  baseURL: "http://localhost:3000/api"
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api

