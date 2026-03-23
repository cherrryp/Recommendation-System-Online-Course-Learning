import { createContext, useContext, useEffect, useState } from "react"
import { getBookmarks, toggleBookmark } from "../api/BookmarkApi"

const BookmarkContext = createContext()

export const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState(new Set())

  const user = JSON.parse(localStorage.getItem("user") || "null")
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    getBookmarks(userId).then((r) => {
      setBookmarks(new Set((r.data.data || []).map((c) => c.id)))
    })
  }, [userId])

  const toggle = async (courseId) => {
    const isSaved = bookmarks.has(courseId)

    // confirm ก่อนลบ
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