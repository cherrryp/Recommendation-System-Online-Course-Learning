import AppRoutes from "./routes/AppRoutes"
import Chatbot from "./components/Chatbot"
import { BookmarkProvider } from "./context/BookmarkContext"

function App() {
  return (
    <BookmarkProvider>
      <AppRoutes />
      <Chatbot />
    </BookmarkProvider>
  )
}

export default App