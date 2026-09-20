import { useState, type FormEvent } from 'react'
import { useAuth } from './authContext'
import { usePreferences } from '../../shared/preferences/preferencesContext'
import './AuthScreen.css'

export default function AuthScreen() {
  const { login, register } = useAuth()
  const { locale, setLocale, theme, toggleTheme, t } = usePreferences()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (
      !username.trim() ||
      !password ||
      (mode === 'register' && !displayName.trim())
    ) {
      setError(t('auth.required'))
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordLength'))
      return
    }
    if (mode === 'register' && password !== confirmation) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      if (mode === 'login') await login(username, password)
      else await register(username, displayName, password)
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message === 'USERNAME_TAKEN'
          ? t('auth.usernameTaken')
          : t('auth.invalid'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-preferences">
        <button
          onClick={() => setLocale(locale === 'en' ? 'my' : 'en')}
          aria-label={t('preference.language')}
        >
          {locale === 'en' ? t('preference.myanmar') : t('preference.english')}
        </button>
        <button onClick={toggleTheme} aria-label={t('preference.theme')}>
          {theme === 'light' ? '☾' : '☀'}
        </button>
      </div>
      <section className="auth-card">
        <div className="auth-brand">
          <span>S</span>
          <strong>{t('app.name')}</strong>
        </div>
        <h1>{t(mode === 'login' ? 'auth.login' : 'auth.register')}</h1>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              <span>{t('auth.displayName')}</span>
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
          )}
          <label>
            <span>{t('auth.username')}</span>
            <input
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label>
            <span>{t('auth.password')}</span>
            <input
              type="password"
              autoComplete={
                mode === 'login' ? 'current-password' : 'new-password'
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === 'register' && (
            <label>
              <span>{t('auth.confirmPassword')}</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" disabled={busy}>
            {t(mode === 'login' ? 'auth.login' : 'auth.register')}
          </button>
        </form>
        <button
          className="auth-switch"
          onClick={() => {
            setMode((current) => (current === 'login' ? 'register' : 'login'))
            setError('')
          }}
        >
          {t(mode === 'login' ? 'auth.noAccount' : 'auth.haveAccount')}
        </button>
      </section>
    </main>
  )
}
