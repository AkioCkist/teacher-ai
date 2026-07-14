import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import SessionPage from './pages/SessionPage'
import EvaluationPage from './pages/EvaluationPage'
import HistoryPage from './pages/HistoryPage'
import SessionsPage from './pages/SessionsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="session/:sessionId" element={<SessionPage />} />
        <Route path="evaluation/:sessionId" element={<EvaluationPage />} />
        <Route path="history/:sessionId" element={<HistoryPage />} />
      </Route>
    </Routes>
  )
}

export default App
