import Dashboard from '../features/dashboard/Dashboard'
import { PreferencesProvider } from '../shared/preferences/PreferencesProvider'

function App() {
  return (
    <PreferencesProvider>
      <main>
        <Dashboard />
      </main>
    </PreferencesProvider>
  )
}

export default App
