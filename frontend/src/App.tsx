import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Landing from './pages/Landing'
import EventBrowser from './pages/EventBrowser'
import LiveEvent from './pages/LiveEvent'
import AnalysisPanel from './pages/AnalysisPanel'
import PredictionBoard from './pages/PredictionBoard'
import AlertManager from './pages/AlertManager'
import PostEventReport from './pages/PostEventReport'
import AdminDashboard from './pages/AdminDashboard'
import Layout from './components/Layout'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/events" element={<EventBrowser />} />
          <Route path="/events/:eventId/live" element={<LiveEvent />} />
          <Route path="/events/:eventId/analysis" element={<AnalysisPanel />} />
          <Route path="/events/:eventId/report" element={<PostEventReport />} />
          <Route path="/predictions" element={<PredictionBoard />} />
          <Route path="/alerts" element={<AlertManager />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App