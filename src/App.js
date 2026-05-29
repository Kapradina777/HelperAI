import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import AuthPage from './pages/AuthPage'
import AdaApp from './pages/AdaApp'
import AdminApp from './pages/AdminApp'
import HelperApp from './pages/HelperApp'

function Router() {
  const { profile, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'sans-serif', color:'#888' }}>
      Загрузка...
    </div>
  )

  if (!profile) return <AuthPage />

  if (profile.role === 'ada') return <AdaApp />
  if (profile.role === 'admin') return <AdminApp />
  if (profile.role === 'helper') return <HelperApp />

  return <Navigate to="/" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Router />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
