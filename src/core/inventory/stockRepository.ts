import type { StockMovement } from './types'

const STORAGE_KEY = 'salepilot.stock-movements.v2'

export interface StockMovementRepository {
  list(): readonly StockMovement[]
  add(movement: StockMovement): void
  update(movement: StockMovement): void
  remove(movementId: string): void
  assignCategory(
    movementId: string,
    categoryId?: string,
    categoryName?: string,
  ): void
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

  update(movement: StockMovement): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        this.list().map((item) => (item.id === movement.id ? movement : item)),
      ),
    )
  }

  remove(movementId: string): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.list().filter(({ id }) => id !== movementId)),
    )
  }

  assignCategory(
    movementId: string,
    categoryId?: string,
    categoryName?: string,
  ): void {
    const movements = this.list().map((movement) => {
      if (movement.id !== movementId) return movement
      const updated = { ...movement }
      if (categoryId && categoryName) {
        updated.categoryId = categoryId
        updated.categoryName = categoryName
      } else {
        delete updated.categoryId
        delete updated.categoryName
      }
      return updated
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movements))
  }
}

export const stockMovementRepository = new LocalStockMovementRepository()
