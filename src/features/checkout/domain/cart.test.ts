import { describe, expect, it } from 'vitest'
import {
  addProduct,
  calculateCartTotal,
  changeQuantity,
  formatMoney,
  type Product,
} from './cart'

const tea: Product = {
  id: 'tea',
  name: 'Myanmar Milk Tea',
  category: 'Drinks',
  priceMinor: 2_500,
  color: '#f5a623',
  shortCode: 'MT',
}

describe('cart', () => {
  it('adds a product and increases its quantity without duplicating the line', () => {
    const firstCart = addProduct([], tea)
    const secondCart = addProduct(firstCart, tea)

    expect(secondCart).toEqual([{ product: tea, quantity: 2 }])
  })

  it('removes a line when its quantity reaches zero', () => {
    expect(changeQuantity([{ product: tea, quantity: 1 }], tea.id, -1)).toEqual(
      [],
    )
  })

  it('calculates totals using integer money values', () => {
    expect(calculateCartTotal([{ product: tea, quantity: 3 }])).toBe(7_500)
    expect(formatMoney(7_500)).toBe('7,500 Ks')
  })
})
