import type { DatabaseProvider, Migration } from './types'

export async function runMigrations(
  database: DatabaseProvider,
  migrations: readonly Migration[],
): Promise<void> {
  const currentVersion = await database.getVersion()
  const pendingMigrations = migrations
    .filter(({ version }) => version > currentVersion)
    .toSorted((left, right) => left.version - right.version)

  for (const migration of pendingMigrations) {
    await database.transaction(async () => {
      await migration.migrate(database)
      await database.setVersion(migration.version)
    })
  }
}
