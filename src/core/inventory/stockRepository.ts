import type { StockMovement } from './types'

const STORAGE_KEY = 'salepilot.stock-movements.v2'

export interface StockMovementRepository {
  list(): readonly StockMovement[]
  add(movement: StockMovement): void
}

export class LocalStockMovementRepository implements StockMovementRepository {
  list(): readonly StockMovement[] {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    try {
      const parsed: unknown = JSON.parse(stored)
      return Array.isArray(parsed) ? (parsed as StockMovement[]) : []
    } catch {
      return []
    }
  }

  add(movement: StockMovement): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([movement, ...this.list()]),
    )
  }
}

export const stockMovementRepository = new LocalStockMovementRepository()
