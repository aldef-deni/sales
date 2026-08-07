import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { AuthProvider, useAuth } from './lib/auth'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { LoginPage } from './pages/LoginPage'
import { PipelinePage } from './pages/PipelinePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="pipeline" element={<PipelinePage />} />
              <Route path="leads" element={<LeadsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function RequireAuth() {
  const { user, ready } = useAuth()

  // Menunggu verifikasi token selesai — tanpa ini pengguna yang sudah login
  // akan terlempar ke halaman login sekejap setiap kali halaman dimuat ulang.
  if (!ready) return <div className="login-plane">Memuat…</div>
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
