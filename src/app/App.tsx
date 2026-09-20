import Dashboard from '../features/dashboard/Dashboard'
import AuthScreen from '../features/auth/AuthScreen'
import { AuthProvider } from '../features/auth/AuthProvider'
import { useAuth } from '../features/auth/authContext'
import { PreferencesProvider } from '../shared/preferences/PreferencesProvider'

function App() {
  return (
    <PreferencesProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </PreferencesProvider>
  )
}

function AppContent() {
  const { user } = useAuth()
  return user ? (
    <main>
      <Dashboard />
    </main>
  ) : (
    <AuthScreen />
  )
}

export default App
