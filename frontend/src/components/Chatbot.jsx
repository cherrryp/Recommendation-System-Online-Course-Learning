import { useState, useRef, useEffect } from "react"
import "./Chatbot.css"
import { UNI_NAMES } from "../constants/universities"

function MiniCard({ course }) {
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="mini-card"
    >
      {course.thumbnailUrl && (
        <div
          className="mini-card-img"
          style={{ backgroundImage: `url(${course.thumbnailUrl})` }}
        />
      )}
      <div className="mini-card-info">
        <p className="mini-card-title">{course.title}</p>
        <p className="mini-card-uni">
          {UNI_NAMES[course.university] || course.university || "-"}
        </p>
        <span className={`price-badge ${course.price === 0 ? "free" : "paid"}`}>
          {course.price === 0 ? "ฟรี" : `${course.price} ฿`}
        </span>
      </div>
    </a>
  )
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "สวัสดีครับ! ฉันช่วยแนะนำคอร์สที่ตรงกับความสนใจของคุณได้ บอกมาเลยว่าอยากเรียนอะไร 😊",
      courses: []
    }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id
  const token = localStorage.getItem("token")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    if (!userId) {
      setMessages((prev) => [...prev,
        { role: "user", content: input, courses: [] },
        { role: "assistant", content: "กรุณาเข้าสู่ระบบก่อนใช้งาน chatbot ครับ 🙏", courses: [] }
      ])
      setInput("")
      return
    }

    const userMsg = { role: "user", content: input, courses: [] }
    const history = messages.slice(-6).map(({ role, content }) => ({ role, content }))
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("http://localhost:3000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, message: input, history }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: data.reply || "ขออภัย ไม่สามารถตอบได้ในขณะนี้",
        courses: data.courses || []
      }])
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
        courses: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "สวัสดีครับ! ฉันช่วยแนะนำคอร์สที่ตรงกับความสนใจของคุณได้ บอกมาเลยว่าอยากเรียนอะไร 😊",
      courses: []
    }])
  }

  return (
    <div className="chatbot-wrapper">
      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🤖</div>
              <div>
                <p className="chatbot-name">LearningPath AI</p>
                <p className="chatbot-status">แนะนำคอร์สให้คุณ</p>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button onClick={clearChat} title="ล้างแชท" className="btn-clear">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z"/>
                </svg>
              </button>
              <button onClick={() => setOpen(false)} className="btn-close">✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i}>
                <div className={`msg ${msg.role}`}>
                  {msg.role === "assistant" && <span className="msg-avatar">🤖</span>}
                  <div className="msg-bubble">{msg.content}</div>
                </div>
                {/* mini cards ต่อท้าย assistant message */}
                {msg.role === "assistant" && msg.courses?.length > 0 && (
                  <div className="mini-cards">
                    {msg.courses.map((course) => (
                      <MiniCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg assistant">
                <span className="msg-avatar">🤖</span>
                <div className="msg-bubble typing">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chatbot-input" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="พิมพ์คำถามหรือความสนใจ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>ส่ง</button>
          </form>
        </div>
      )}

      <button className="chatbot-toggle" onClick={() => setOpen((prev) => !prev)}>
        {open ? "✕" : (
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        )}
      </button>
    </div>
  )
}

export default Chatbot
