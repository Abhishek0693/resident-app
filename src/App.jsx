import { AppProvider, useApp } from './context/AppContext'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import ResidentDashboard from './pages/resident/ResidentDashboard'

function AppRouter() {
  const { currentUser } = useApp()

  if (!currentUser) return <Login />
  if (currentUser.role === 'admin') return <AdminDashboard />
  return <ResidentDashboard />
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  )
}
