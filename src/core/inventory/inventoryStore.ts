import type { InventoryProduct, StockMovement } from './types'

const STORAGE_KEY = 'salepilot.inventory.v1'
const LEGACY_PRODUCT_KEY = 'salepilot.inventory-products.v1'
const LEGACY_MOVEMENT_KEY = 'salepilot.stock-movements.v2'

export interface InventorySnapshot {
  readonly products: readonly InventoryProduct[]
  readonly movements: readonly StockMovement[]
}

function legacyList<T>(key: string): T[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function readInventory(): InventorySnapshot {
  try {
    const parsed: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    if (
      parsed &&
      typeof parsed === 'object' &&
      'products' in parsed &&
      'movements' in parsed &&
      Array.isArray(parsed.products) &&
      Array.isArray(parsed.movements)
    )
      return parsed as unknown as InventorySnapshot
  } catch {
    // Fall through to the legacy data migration.
  }
  return {
    products: legacyList<InventoryProduct>(LEGACY_PRODUCT_KEY),
    movements: legacyList<StockMovement>(LEGACY_MOVEMENT_KEY),
  }
}

export function writeInventory(snapshot: InventorySnapshot): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    throw new Error('STORAGE_WRITE_FAILED')
  }
}

export function commitInventoryAdd(
  products: readonly InventoryProduct[],
  movements: readonly StockMovement[],
): void {
  const current = readInventory()
  const commandIds = new Set(
    current.movements.flatMap(({ commandId }) =>
      commandId ? [commandId] : [],
    ),
  )
  if (movements.some(({ commandId }) => commandId && commandIds.has(commandId)))
    return
  writeInventory({
    products: [...current.products, ...products],
    movements: [...movements, ...current.movements],
  })
}

export function commitInventoryUpdate(
  product: InventoryProduct,
  movement?: StockMovement,
): void {
  const current = readInventory()
  writeInventory({
    products: current.products.map((item) =>
      item.id === product.id ? product : item,
    ),
    movements: movement ? [movement, ...current.movements] : current.movements,
  })
}

export function commitProductDelete(productId: string): void {
  const current = readInventory()
  if (current.movements.some((movement) => movement.productId === productId))
    throw new Error('PRODUCT_HAS_HISTORY')
  writeInventory({
    ...current,
    products: current.products.filter(({ id }) => id !== productId),
  })
}
