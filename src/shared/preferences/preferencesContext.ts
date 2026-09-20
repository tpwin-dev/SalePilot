import { createContext, useContext } from 'react'
import type { Locale, MessageKey } from '../i18n/messages'

export type Theme = 'light' | 'dark'
export interface PreferencesValue {
  locale: Locale
  theme: Theme
  setLocale: (locale: Locale) => void
  toggleTheme: () => void
  t: (key: MessageKey, values?: Readonly<Record<string, string>>) => string
}
export const PreferencesContext = createContext<PreferencesValue | null>(null)
export function usePreferences(): PreferencesValue {
  const value = useContext(PreferencesContext)
  if (!value)
    throw new Error('usePreferences must be used within PreferencesProvider')
  return value
}
