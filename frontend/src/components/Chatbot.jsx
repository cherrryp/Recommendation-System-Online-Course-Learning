import { useState, useRef, useEffect } from "react"
import "./Chatbot.css"
import { UNI_NAMES } from "../constants/universities"
import { useBookmark } from "../context/BookmarkContext"

const UNI_HOVER_IMAGES = {
  Chulalongkorn: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/563000010687901_iw03ss.jpg",
  CMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/unnamed_bguhc3.png",
  KKU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774249715/KKU_SLA_Logo.svg_yzfddp.png",
  HU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774250735/ChatGPT_Image_Mar_23_2026_02_25_12_PM_h68py4.png",
  KMITL: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/KMITL_Sublogo.svg_svlwi2.png",
  KU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/png-clipart-kasetsart-university-national-pingtung-university-of-science-and-technology-king-mongkut-s-university-of-technology-thonburi-student-student-thumbnail_ewqzaa.png",
  MJU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248858/MJU_LOGO_nbczak.svg",
  NU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248857/NULOGO-EN_y4g3de.png",
  PSU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_emjhsc.png",
  RMU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248855/images_1_f701zp.png",
  SRU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo-sru-png_neqczi.png",
  TU: "https://res.cloudinary.com/dygjtp2be/image/upload/v1774248856/logo01_ooeuuf.jpg",
}

function MiniCard({ course, bookmarked, onBookmark }) {
  const fallbackImg = UNI_HOVER_IMAGES[course.university]
  const displayImg = course.thumbnailUrl || fallbackImg

  return (
    <div className="mini-card">
      <a href={course.url} target="_blank" rel="noopener noreferrer" className="mini-card-link">
        <div
          className="mini-card-img"
          style={{
            backgroundImage: displayImg ? `url(${displayImg})` : "none",
            backgroundColor: "#e9ecef",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="mini-card-info">
          <p className="mini-card-title">{course.title}</p>
          <p className="mini-card-uni">
            {UNI_NAMES[course.university] || course.university || "-"}
          </p>
          <span className={`price-badge ${!course.price || course.price === 0 ? "free" : "paid"}`}>
            {!course.price || course.price === 0 ? "ฟรี" : `${course.price} ฿`}
          </span>
        </div>
      </a>
      {onBookmark && (
        <button
          className={`mini-bookmark ${bookmarked ? "bookmarked" : ""}`}
          onClick={() => onBookmark(course.id)}
          title={bookmarked ? "ยกเลิก bookmark" : "บันทึก"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={bookmarked ? "#6c63ff" : "none"}
            stroke={bookmarked ? "#6c63ff" : "#aaa"} strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}
    </div>
  )
}

function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{
    role: "assistant",
    content: "สวัสดีครับ! 👋 พิมพ์บอกเลยว่าสนใจเรียนอะไร หรือกดเลือกด้านล่างได้เลยครับ 😊",
    courses: [],
    quickReplies: [
      { label: "💻 เทคโนโลยี", value: "แนะนำคอร์สด้านเทคโนโลยี" },
      { label: "🏥 สุขภาพ", value: "แนะนำคอร์สด้านสุขภาพ" },
      { label: "📊 ธุรกิจ", value: "แนะนำคอร์สด้านธุรกิจ" },
      { label: "✅ คอร์สฟรี", value: "ขอคอร์สฟรีหน่อย" },
    ],
  }])

  const { bookmarks, toggle } = useBookmark()
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [lastIntent, setLastIntent] = useState(null)
  const [lastPage, setLastPage] = useState(1)
  const bottomRef = useRef(null)

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id
  const token = localStorage.getItem("token")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const addMessage = (role, content, courses = [], quickReplies = []) => {
    setMessages((prev) => [...prev, { role, content, courses, quickReplies }])
  }

  const sendToAPI = async (message, page = 1) => {
    if (!userId) {
      addMessage("assistant", "กรุณาเข้าสู่ระบบก่อนใช้งานครับ 🙏")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, message, page }),
      })
      const data = await res.json()

      // เก็บ intent ล่าสุดไว้สำหรับ "ดูเพิ่มเติม"
      if (data.intent) setLastIntent(data.intent)
      setLastPage(page)

      // สร้าง quick reply ตามสถานการณ์
      const quickReplies = data.courses?.length > 0
        ? [
            ...(data.hasMore ? [{ label: "➕ ดูเพิ่มเติม", value: "__more__" }] : []),
            { label: "🔄 เปลี่ยนหมวด", value: "อยากดูหมวดอื่น" },
            { label: "✅ เฉพาะฟรี", value: "ขอแบบฟรีได้ไหม" },
          ]
        : [
            { label: "💻 เทคโนโลยี", value: "แนะนำคอร์สด้านเทคโนโลยี" },
            { label: "🏥 สุขภาพ", value: "แนะนำคอร์สด้านสุขภาพ" },
            { label: "📊 ธุรกิจ", value: "แนะนำคอร์สด้านธุรกิจ" },
            { label: "✅ คอร์สฟรี", value: "ขอคอร์สฟรีหน่อย" },
          ]

      addMessage(
        "assistant",
        data.reply || "ขออภัย ไม่สามารถตอบได้ในขณะนี้",
        data.courses || [],
        quickReplies
      )
    } catch {
      addMessage("assistant", "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", [], [])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    addMessage("user", text)
    await sendToAPI(text)
  }

  const handleQuickReply = async (value) => {
    if (loading) return

    // ดูเพิ่มเติม → ใช้ intent เดิม page ถัดไป
    if (value === "__more__") {
      const nextPage = lastPage + 1
      addMessage("user", "ขอดูเพิ่มเติม")
      // ส่ง message เดิมที่ทำให้ได้ intent นั้น แต่เพิ่ม page
      const msg = lastIntent?.category
        ? `แนะนำคอร์สด้าน${lastIntent.category}`
        : "ขอดูเพิ่มเติม"
      await sendToAPI(msg, nextPage)
      return
    }

    addMessage("user", value)
    await sendToAPI(value)
  }

  const handleBookmark = async (courseId) => {
    await toggle(courseId)
  }

  const clearChat = () => {
    setLastIntent(null)
    setLastPage(1)
    setMessages([{
      role: "assistant",
      content: "สวัสดีครับ! 👋 พิมพ์บอกเลยว่าสนใจเรียนอะไร หรือกดเลือกด้านล่างได้เลยครับ 😊",
      courses: [],
      quickReplies: [
        { label: "💻 เทคโนโลยี", value: "แนะนำคอร์สด้านเทคโนโลยี" },
        { label: "🏥 สุขภาพ", value: "แนะนำคอร์สด้านสุขภาพ" },
        { label: "📊 ธุรกิจ", value: "แนะนำคอร์สด้านธุรกิจ" },
        { label: "✅ คอร์สฟรี", value: "ขอคอร์สฟรีหน่อย" },
      ],
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
                  <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6h1V4h-5V3H9zm0 5h2v9H9V8zm4 0h2v9h-2V8z" />
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

                {msg.courses?.length > 0 && (
                  <div className="mini-cards">
                    {msg.courses.map((course) => (
                      <MiniCard
                        key={course.id}
                        course={course}
                        bookmarked={bookmarks.has(course.id)}
                        onBookmark={handleBookmark}
                      />
                    ))}
                  </div>
                )}

                {msg.quickReplies?.length > 0 && i === messages.length - 1 && (
                  <div className="quick-replies">
                    {msg.quickReplies.map((qr) => (
                      <button
                        key={qr.label}
                        className="quick-reply-btn"
                        onClick={() => handleQuickReply(qr.value)}
                        disabled={loading}
                      >
                        {qr.label}
                      </button>
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

          <form className="chatbot-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="พิมพ์ถามได้เลยครับ..."
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
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default Chatbot