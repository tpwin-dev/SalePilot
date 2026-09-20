import { describe, expect, it } from 'vitest'
import { calculateBaseQuantity, createStockReceipt } from './stock'
import type { InventoryProduct } from './types'

describe('inventory quantity conversion', () => {
  it('converts Burmese viss to the product base unit without floating-point loss', () => {
    expect(calculateBaseQuantity('2.35', '1632.93')).toBe('3837.3855')
  })

  it('supports very large and highly precise quantities', () => {
    expect(calculateBaseQuantity('999999999999.999999', '0.000001')).toBe(
      '999999.999999999999',
    )
  })

  it('rejects zero and negative stock receipts', () => {
    expect(() => calculateBaseQuantity('0', '1000')).toThrow(
      'greater than zero',
    )
    expect(() => calculateBaseQuantity('-1', '1000')).toThrow(
      'greater than zero',
    )
  })

  it('stores only base quantity while preserving the entered-unit audit snapshot', () => {
    const product: InventoryProduct = {
      id: 'product-1',
      name: 'Test product',
      sku: 'TEST-1',
      baseUnitId: 'piece',
      quantityPrecision: 0,
      productUnits: [
        {
          id: 'case-unit',
          productId: 'product-1',
          unitId: 'case',
          baseQuantity: '24',
          canPurchase: true,
          canSell: true,
        },
      ],
    }

    const movement = createStockReceipt(
      {
        product,
        productUnitId: 'case-unit',
        enteredQuantity: '3',
        locationId: 'main-store',
        occurredAt: '2026-09-20T00:00:00.000Z',
      },
      'movement-1',
    )

    expect(movement.baseQuantity).toBe('72')
    expect(movement.enteredQuantity).toBe('3')
    expect(movement.enteredUnitId).toBe('case')
    expect(movement.conversionToBase).toBe('24')
  })
})
