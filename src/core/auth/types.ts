export interface UserAccount {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly role: 'owner' | 'manager' | 'cashier'
  readonly passwordHash: string
  readonly passwordSalt: string
  readonly createdAt: string
}

export interface AuthenticatedUser {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly role: UserAccount['role']
}
