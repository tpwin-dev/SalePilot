export interface ProductCategory {
  readonly id: string
  readonly name: string
  readonly createdAt: string
}

const STORAGE_KEY = 'salepilot.product-categories.v1'

function read(): ProductCategory[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? (value as ProductCategory[]) : []
  } catch {
    return []
  }
}

export const categoryRepository = {
  list: (): readonly ProductCategory[] => read(),
  create(name: string): ProductCategory {
    const normalized = name.trim()
    const existing = read().find(
      (category) =>
        category.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
    )
    if (existing) return existing
    const category = {
      id: crypto.randomUUID(),
      name: normalized,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...read(), category]))
    return category
  },
}
