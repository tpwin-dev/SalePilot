export type UnitDimension =
  'count' | 'mass' | 'volume' | 'length' | 'area' | 'time' | 'custom'

export type UnitSystem = 'SI' | 'IMPERIAL' | 'MYANMAR' | 'CUSTOM'

export interface UnitDefinition {
  readonly id: string
  readonly code: string
  readonly dimension: UnitDimension
  readonly system: UnitSystem
  readonly name: string
  readonly symbol: string
  readonly nameMy?: string
  readonly symbolMy?: string
  readonly decimalPlaces: number
  /** Exact multiplier to the dimension's canonical unit. */
  readonly canonicalNumerator: string
  readonly canonicalDenominator: string
}

export interface ProductUnit {
  readonly id: string
  readonly productId: string
  readonly unitId: string
  /** Exact quantity of the product's base unit contained in one selling unit. */
  readonly baseQuantity: string
  readonly barcode?: string
  readonly canPurchase: boolean
  readonly canSell: boolean
}

export interface InventoryProduct {
  readonly id: string
  readonly name: string
  readonly sku: string
  readonly sellingPrice?: string
  readonly baseUnitId: string
  readonly categoryId?: string
  readonly categoryName?: string
  readonly variantName?: string
  readonly variantOptions?: Readonly<Record<string, string>>
  readonly quantityPrecision: number
  readonly productUnits: readonly ProductUnit[]
}

export type StockMovementType =
  | 'opening'
  | 'purchase'
  | 'sale'
  | 'customer_return'
  | 'supplier_return'
  | 'adjustment'
  | 'damage'
  | 'production'
  | 'consumption'
  | 'transfer_in'
  | 'transfer_out'

export interface StockMovement {
  readonly id: string
  readonly productId: string
  readonly productName: string
  readonly productSku: string
  readonly variantName?: string
  readonly variantOptions?: Readonly<Record<string, string>>
  readonly baseUnitId: string
  readonly categoryId?: string
  readonly categoryName?: string
  readonly locationId?: string
  readonly type: StockMovementType
  /** The only quantity used when calculating stock balances. */
  readonly baseQuantity: string
  /** Audit snapshot of what the operator entered. */
  readonly enteredQuantity: string
  readonly enteredUnitId: string
  readonly conversionToBase: string
  readonly unitCost?: string
  readonly sellingPrice?: string
  readonly reference?: string
  readonly note?: string
  readonly occurredAt: string
}

export interface AddStockInput {
  readonly product: InventoryProduct
  readonly productUnitId: string
  readonly enteredQuantity: string
  readonly locationId?: string
  readonly unitCost?: string
  readonly reference?: string
  readonly note?: string
  readonly occurredAt: string
}
