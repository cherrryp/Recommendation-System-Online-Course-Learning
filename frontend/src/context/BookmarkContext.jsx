import { createContext, useContext, useEffect, useState } from "react"
import { getBookmarks, toggleBookmark } from "../api/BookmarkApi"

const BookmarkContext = createContext()

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(new Set())

  // อ่าน userId ตอนใช้งานจริง ไม่ใช่ตอน mount
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem("user") || "null")
    return user?.id
  }

  useEffect(() => {
    const userId = getUserId()
    if (!userId) return
    getBookmarks(userId).then((r) => {
      setBookmarks(new Set((r.data.data || []).map((c) => c.id)))
    })
  }, [])  

  const toggle = async (courseId) => {
    const userId = getUserId()  // ← อ่านใหม่ทุกครั้งที่กด
    if (!userId) return false

    const isSaved = bookmarks.has(courseId)
    if (isSaved) {
      const ok = window.confirm("ต้องการยกเลิก bookmark ใช่ไหม?")
      if (!ok) return false
    }

    const res = await toggleBookmark(userId, courseId)
    const { bookmarked } = res.data
    setBookmarks((prev) => {
      const next = new Set(prev)
      bookmarked ? next.add(courseId) : next.delete(courseId)
      return next
    })
    return bookmarked
  }

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggle }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export const useBookmark = () => useContext(BookmarkContext)