export interface StockParty {
  readonly id: string
  readonly name: string
  readonly createdAt: string
}

function repository(key: string) {
  function read(): StockParty[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
      return Array.isArray(parsed) ? (parsed as StockParty[]) : []
    } catch {
      return []
    }
  }
  return {
    list: (): readonly StockParty[] => read(),
    create(name: string): StockParty {
      const normalized = name.trim()
      if (!normalized) throw new Error('NAME_REQUIRED')
      const existing = read().find(
        (item) =>
          item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
      )
      if (existing) return existing
      const item = {
        id: crypto.randomUUID(),
        name: normalized,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify([...read(), item]))
      return item
    },
  }
}

export const supplierRepository = repository('salepilot.suppliers.v1')
export const locationRepository = repository('salepilot.stock-locations.v1')
