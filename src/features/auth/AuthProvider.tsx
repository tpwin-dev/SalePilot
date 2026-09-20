import { useState, type ReactNode } from 'react'
import { authRepository } from '../../core/auth/authRepository'
import type { AuthenticatedUser } from '../../core/auth/types'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() =>
    authRepository.currentUser(),
  )
  const [hasAccounts, setHasAccounts] = useState(() =>
    authRepository.hasAccounts(),
  )
  async function login(username: string, password: string) {
    setUser(await authRepository.login(username, password))
  }
  async function register(
    username: string,
    displayName: string,
    password: string,
  ) {
    setUser(await authRepository.register(username, displayName, password))
    setHasAccounts(true)
  }
  function logout() {
    authRepository.logout()
    setUser(null)
  }
  return (
    <AuthContext.Provider
      value={{ user, hasAccounts, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
