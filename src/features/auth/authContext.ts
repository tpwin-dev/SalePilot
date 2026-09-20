import { createContext, useContext } from 'react'
import type { AuthenticatedUser } from '../../core/auth/types'

export interface AuthValue {
  user: AuthenticatedUser | null
  hasAccounts: boolean
  login: (username: string, password: string) => Promise<void>
  register: (
    username: string,
    displayName: string,
    password: string,
  ) => Promise<void>
  logout: () => void
}
export const AuthContext = createContext<AuthValue | null>(null)
export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
