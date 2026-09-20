import { compareDecimal, multiplyDecimals, normalizeDecimal } from './decimal'
import type { AddStockInput, StockMovement } from './types'

export function calculateBaseQuantity(
  enteredQuantity: string,
  conversionToBase: string,
): string {
  if (compareDecimal(enteredQuantity, '0') <= 0)
    throw new Error('Quantity must be greater than zero')
  if (compareDecimal(conversionToBase, '0') <= 0)
    throw new Error('Unit conversion must be greater than zero')
  return multiplyDecimals(enteredQuantity, conversionToBase)
}

export function createStockReceipt(
  input: AddStockInput,
  id: string = crypto.randomUUID(),
): StockMovement {
  const productUnit = input.product.productUnits.find(
    ({ id: unitId }) => unitId === input.productUnitId,
  )
  if (!productUnit || !productUnit.canPurchase)
    throw new Error('Selected unit cannot be used for purchases')

  const baseQuantity = calculateBaseQuantity(
    input.enteredQuantity,
    productUnit.baseQuantity,
  )
  return {
    id,
    productId: input.product.id,
    productName: input.product.name,
    baseUnitId: input.product.baseUnitId,
    locationId: input.locationId,
    type: 'purchase',
    baseQuantity,
    enteredQuantity: normalizeDecimal(input.enteredQuantity),
    enteredUnitId: productUnit.unitId,
    conversionToBase: normalizeDecimal(productUnit.baseQuantity),
    occurredAt: input.occurredAt,
    ...(input.unitCost ? { unitCost: normalizeDecimal(input.unitCost) } : {}),
    ...(input.reference ? { reference: input.reference.trim() } : {}),
    ...(input.note ? { note: input.note.trim() } : {}),
  }
}
