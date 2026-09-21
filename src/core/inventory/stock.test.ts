import { describe, expect, it } from 'vitest'
import {
  calculateBaseQuantity,
  calculateStockOnHand,
  calculateWeightedAverageCost,
  createStockCorrection,
  createStockReceipt,
} from './stock'
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
      sellingPrice: '12500.50',
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
    expect(movement.sellingPrice).toBe('12500.5')
  })

  it('preserves receiving and operator audit metadata', () => {
    const product: InventoryProduct = {
      id: 'product-1',
      name: 'Medicine',
      sku: 'MED-1',
      baseUnitId: 'piece',
      quantityPrecision: 0,
      productUnits: [
        {
          id: 'piece',
          productId: 'product-1',
          unitId: 'piece',
          baseQuantity: '1',
          canPurchase: true,
          canSell: true,
        },
      ],
    }
    const movement = createStockReceipt(
      {
        product,
        productUnitId: 'piece',
        enteredQuantity: '5',
        unitCost: '10',
        supplierId: 'supplier-1',
        supplierName: 'Main supplier',
        locationId: 'location-1',
        locationName: 'Main store',
        reference: 'PO-100',
        batchNumber: 'B-42',
        expiryDate: '2027-12-31',
        actorId: 'user-1',
        actorName: 'Owner',
        commandId: 'command-1',
        occurredAt: '2026-09-21T00:00:00.000Z',
      },
      'movement-1',
    )
    expect(movement).toMatchObject({
      supplierName: 'Main supplier',
      locationName: 'Main store',
      reference: 'PO-100',
      batchNumber: 'B-42',
      expiryDate: '2027-12-31',
      actorName: 'Owner',
      commandId: 'command-1',
    })
  })

  it('projects stock from immutable receipts and reversing corrections', () => {
    const product: InventoryProduct = {
      id: 'product-1',
      name: 'Rice',
      sku: 'RICE',
      baseUnitId: 'piece',
      quantityPrecision: 0,
      productUnits: [
        {
          id: 'case',
          productId: 'product-1',
          unitId: 'case',
          baseQuantity: '24',
          canPurchase: true,
          canSell: false,
        },
      ],
    }
    const receipt = createStockReceipt(
      {
        product,
        productUnitId: 'case',
        enteredQuantity: '3',
        unitCost: '120',
        occurredAt: '2026-09-20T00:00:00.000Z',
      },
      'receipt-1',
    )
    const correction = createStockCorrection(
      receipt,
      'Duplicate receipt',
      'correction-1',
    )
    expect(calculateStockOnHand(product.id, [receipt])).toBe('72')
    expect(calculateStockOnHand(product.id, [receipt, correction])).toBe('0')
    expect(correction.reversalOfId).toBe('receipt-1')
    expect(correction.correctionReason).toBe('Duplicate receipt')
  })

  it('calculates exact weighted-average base-unit cost across purchase units', () => {
    const product: InventoryProduct = {
      id: 'product-1',
      name: 'Water',
      sku: 'WATER',
      baseUnitId: 'piece',
      quantityPrecision: 0,
      productUnits: [
        {
          id: 'piece',
          productId: 'product-1',
          unitId: 'piece',
          baseQuantity: '1',
          canPurchase: true,
          canSell: true,
        },
        {
          id: 'case',
          productId: 'product-1',
          unitId: 'case',
          baseQuantity: '12',
          canPurchase: true,
          canSell: false,
        },
      ],
    }
    const pieceReceipt = createStockReceipt(
      {
        product,
        productUnitId: 'piece',
        enteredQuantity: '12',
        unitCost: '2',
        occurredAt: '2026-09-20T00:00:00.000Z',
      },
      'r1',
    )
    const caseReceipt = createStockReceipt(
      {
        product,
        productUnitId: 'case',
        enteredQuantity: '2',
        unitCost: '30',
        occurredAt: '2026-09-21T00:00:00.000Z',
      },
      'r2',
    )
    expect(
      calculateWeightedAverageCost(product.id, [pieceReceipt, caseReceipt]),
    ).toBe('2.333333')
    const correction = createStockCorrection(
      caseReceipt,
      'Wrong delivery',
      'c1',
    )
    expect(
      calculateWeightedAverageCost(product.id, [
        pieceReceipt,
        caseReceipt,
        correction,
      ]),
    ).toBe('2')
  })
})
