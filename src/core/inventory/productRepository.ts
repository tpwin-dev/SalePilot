import type { InventoryProduct } from './types'
import { readInventory, writeInventory } from './inventoryStore'

export const productRepository = {
  list(): readonly InventoryProduct[] {
    return readInventory().products
  },
  saveMany(products: readonly InventoryProduct[]): void {
    const current = readInventory()
    const next = [...current.products]
    for (const product of products) {
      const index = next.findIndex(({ id }) => id === product.id)
      if (index >= 0) next[index] = product
      else next.push(product)
    }
    writeInventory({ ...current, products: next })
  },
  update(product: InventoryProduct): void {
    this.saveMany([product])
  },
}
