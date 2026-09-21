import {
  addDecimals,
  compareDecimal,
  divideDecimals,
  multiplyDecimals,
  negateDecimal,
  normalizeDecimal,
} from './decimal'
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
    productSku: input.product.sku,
    ...(input.product.variantName
      ? { variantName: input.product.variantName }
      : {}),
    ...(input.product.variantOptions
      ? { variantOptions: input.product.variantOptions }
      : {}),
    baseUnitId: input.product.baseUnitId,
    ...(input.product.categoryId
      ? { categoryId: input.product.categoryId }
      : {}),
    ...(input.product.categoryName
      ? { categoryName: input.product.categoryName }
      : {}),
    ...(input.locationId ? { locationId: input.locationId } : {}),
    ...(input.locationName ? { locationName: input.locationName } : {}),
    ...(input.supplierId ? { supplierId: input.supplierId } : {}),
    ...(input.supplierName ? { supplierName: input.supplierName } : {}),
    type: 'purchase',
    baseQuantity,
    enteredQuantity: normalizeDecimal(input.enteredQuantity),
    enteredUnitId: productUnit.unitId,
    ...(productUnit.unitName ? { enteredUnitName: productUnit.unitName } : {}),
    conversionToBase: normalizeDecimal(productUnit.baseQuantity),
    occurredAt: input.occurredAt,
    ...(input.unitCost ? { unitCost: normalizeDecimal(input.unitCost) } : {}),
    ...(input.product.sellingPrice
      ? { sellingPrice: normalizeDecimal(input.product.sellingPrice) }
      : {}),
    ...(input.reference ? { reference: input.reference.trim() } : {}),
    ...(input.batchNumber ? { batchNumber: input.batchNumber.trim() } : {}),
    ...(input.expiryDate ? { expiryDate: input.expiryDate } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.actorName ? { actorName: input.actorName } : {}),
    ...(input.commandId ? { commandId: input.commandId } : {}),
    ...(input.note ? { note: input.note.trim() } : {}),
  }
}

const OUTGOING_TYPES = new Set([
  'sale',
  'supplier_return',
  'damage',
  'consumption',
  'transfer_out',
])

export function signedMovementQuantity(movement: StockMovement): string {
  if (movement.type === 'adjustment') return movement.baseQuantity
  return OUTGOING_TYPES.has(movement.type)
    ? negateDecimal(movement.baseQuantity)
    : movement.baseQuantity
}

export function calculateStockOnHand(
  productId: string,
  movements: readonly StockMovement[],
): string {
  return movements
    .filter((movement) => movement.productId === productId)
    .reduce(
      (total, movement) => addDecimals(total, signedMovementQuantity(movement)),
      '0',
    )
}

export function calculateWeightedAverageCost(
  productId: string,
  movements: readonly StockMovement[],
): string | undefined {
  let quantity = '0'
  let value = '0'
  const byId = new Map(movements.map((movement) => [movement.id, movement]))
  for (const movement of movements) {
    if (movement.productId !== productId) continue
    if (movement.type === 'purchase' && movement.unitCost) {
      quantity = addDecimals(quantity, movement.baseQuantity)
      value = addDecimals(
        value,
        multiplyDecimals(movement.enteredQuantity, movement.unitCost),
      )
    }
    if (movement.type === 'adjustment' && movement.reversalOfId) {
      const original = byId.get(movement.reversalOfId)
      if (original?.type === 'purchase' && original.unitCost) {
        quantity = addDecimals(quantity, movement.baseQuantity)
        value = addDecimals(
          value,
          negateDecimal(
            multiplyDecimals(original.enteredQuantity, original.unitCost),
          ),
        )
      }
    }
  }
  return compareDecimal(quantity, '0') > 0
    ? divideDecimals(value, quantity, 6)
    : undefined
}

export function createStockCorrection(
  original: StockMovement,
  reason: string,
  id: string = crypto.randomUUID(),
): StockMovement {
  const normalizedReason = reason.trim()
  if (!normalizedReason) throw new Error('CORRECTION_REASON_REQUIRED')
  return {
    ...original,
    id,
    type: 'adjustment',
    baseQuantity: negateDecimal(signedMovementQuantity(original)),
    enteredQuantity: negateDecimal(original.enteredQuantity),
    occurredAt: new Date().toISOString(),
    reversalOfId: original.id,
    correctionReason: normalizedReason,
  }
}
