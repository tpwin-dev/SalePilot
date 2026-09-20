import { describe, expect, it, vi } from 'vitest'
import { runMigrations } from './runMigrations'
import type { DatabaseProvider, Migration } from './types'

function createDatabase(version: number) {
  let currentVersion = version

  const database: DatabaseProvider = {
    getVersion: async () => currentVersion,
    setVersion: async (nextVersion) => {
      currentVersion = nextVersion
    },
    transaction: async (work) => work(),
  }

  return { database, getCurrentVersion: () => currentVersion }
}

describe('runMigrations', () => {
  it('runs only pending migrations in version order', async () => {
    const { database, getCurrentVersion } = createDatabase(1)
    const executionOrder: number[] = []
    const migrations: Migration[] = [3, 1, 2].map((version) => ({
      version,
      description: `Migration ${version}`,
      migrate: vi.fn(async () => {
        executionOrder.push(version)
      }),
    }))

    await runMigrations(database, migrations)

    expect(executionOrder).toEqual([2, 3])
    expect(getCurrentVersion()).toBe(3)
  })
})
