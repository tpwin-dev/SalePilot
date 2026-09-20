import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../i18n/messages'
import { translate } from '../i18n/translate'
import {
  PreferencesContext,
  type PreferencesValue,
  type Theme,
} from './preferencesContext'

function savedLocale(): Locale {
  return localStorage.getItem('salepilot.locale') === 'my' ? 'my' : 'en'
}
function savedTheme(): Theme {
  const value = localStorage.getItem('salepilot.theme')
  if (value === 'light' || value === 'dark') return value
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(savedLocale)
  const [theme, setTheme] = useState<Theme>(savedTheme)
  useEffect(() => {
    document.documentElement.lang = locale === 'my' ? 'my' : 'en'
    localStorage.setItem('salepilot.locale', locale)
  }, [locale])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('salepilot.theme', theme)
  }, [theme])
  const value = useMemo<PreferencesValue>(
    () => ({
      locale,
      theme,
      setLocale: setLocaleState,
      toggleTheme: () =>
        setTheme((current) => (current === 'light' ? 'dark' : 'light')),
      t: (key, values) => translate(locale, key, values),
    }),
    [locale, theme],
  )
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}
