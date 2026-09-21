import type { StockMovement } from './types'
import { readInventory, writeInventory } from './inventoryStore'

export interface StockMovementRepository {
  list(): readonly StockMovement[]
  add(movement: StockMovement): void
  addMany(movements: readonly StockMovement[]): void
}

export class LocalStockMovementRepository implements StockMovementRepository {
  list(): readonly StockMovement[] {
    return readInventory().movements
  }

  add(movement: StockMovement): void {
    this.addMany([movement])
  }

  addMany(movements: readonly StockMovement[]): void {
    const current = readInventory()
    writeInventory({
      ...current,
      movements: [...movements, ...current.movements],
    })
  }
}

export const stockMovementRepository = new LocalStockMovementRepository()
