import api from "./api"

// ส่งข้อความหา chatbot (userId มาจาก token ฝั่ง backend)
export const sendChatMessage = (message, page = 1) =>
  api.post("/chatbot", { message, page }).then((res) => res.data)
