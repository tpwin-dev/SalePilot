export interface Product {
  readonly id: string
  readonly name: string
  readonly category: string
  readonly priceMinor: number
  readonly color: string
  readonly shortCode: string
}

export interface CartLine {
  readonly product: Product
  readonly quantity: number
}

export function addProduct(
  lines: readonly CartLine[],
  product: Product,
): CartLine[] {
  const existingLine = lines.find((line) => line.product.id === product.id)

  if (!existingLine) {
    return [...lines, { product, quantity: 1 }]
  }

  return lines.map((line) =>
    line.product.id === product.id
      ? { ...line, quantity: line.quantity + 1 }
      : line,
  )
}

export function changeQuantity(
  lines: readonly CartLine[],
  productId: string,
  change: number,
): CartLine[] {
  return lines
    .map((line) =>
      line.product.id === productId
        ? { ...line, quantity: line.quantity + change }
        : line,
    )
    .filter((line) => line.quantity > 0)
}

export function calculateLineTotal(line: CartLine): number {
  return line.product.priceMinor * line.quantity
}

export function calculateCartTotal(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + calculateLineTotal(line), 0)
}

export function calculateItemCount(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0)
}

export function formatMoney(amountMinor: number): string {
  return `${new Intl.NumberFormat('en-US').format(amountMinor)} Ks`
}
