import { createPasswordHash, verifyPassword } from './password'
import type { AuthenticatedUser, UserAccount } from './types'

const USERS_KEY = 'salepilot.users.v1'
const SESSION_KEY = 'salepilot.session.v1'

function publicUser(user: UserAccount): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  }
}

function readUsers(): UserAccount[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]')
    return Array.isArray(value) ? (value as UserAccount[]) : []
  } catch {
    return []
  }
}

export const authRepository = {
  hasAccounts: () => readUsers().length > 0,
  currentUser(): AuthenticatedUser | null {
    const userId = localStorage.getItem(SESSION_KEY)
    const user = readUsers().find(({ id }) => id === userId)
    return user ? publicUser(user) : null
  },
  async register(
    username: string,
    displayName: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const normalized = username.trim().toLowerCase()
    const users = readUsers()
    if (users.some((user) => user.username === normalized))
      throw new Error('USERNAME_TAKEN')
    const passwordData = await createPasswordHash(password)
    const user: UserAccount = {
      id: crypto.randomUUID(),
      username: normalized,
      displayName: displayName.trim(),
      role: 'owner',
      passwordHash: passwordData.hash,
      passwordSalt: passwordData.salt,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]))
    localStorage.setItem(SESSION_KEY, user.id)
    return publicUser(user)
  },
  async login(username: string, password: string): Promise<AuthenticatedUser> {
    const user = readUsers().find(
      (item) => item.username === username.trim().toLowerCase(),
    )
    if (
      !user ||
      !(await verifyPassword(password, user.passwordHash, user.passwordSalt))
    )
      throw new Error('INVALID_CREDENTIALS')
    localStorage.setItem(SESSION_KEY, user.id)
    return publicUser(user)
  },
  logout(): void {
    localStorage.removeItem(SESSION_KEY)
  },
}
