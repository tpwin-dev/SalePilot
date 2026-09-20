export interface Migration {
  readonly version: number
  readonly description: string
  migrate(database: DatabaseProvider): Promise<void>
}

export interface DatabaseProvider {
  getVersion(): Promise<number>
  setVersion(version: number): Promise<void>
  transaction<T>(work: () => Promise<T>): Promise<T>
}
