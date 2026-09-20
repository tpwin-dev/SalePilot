export function resolveSku(
  enteredSku: string,
  existingSkus: readonly string[],
): string {
  const normalized = enteredSku.trim().toUpperCase()
  const used = new Set(existingSkus.map((sku) => sku.toUpperCase()))
  if (normalized) {
    if (used.has(normalized)) throw new Error('SKU_TAKEN')
    return normalized
  }

  let sequence = 1
  while (used.has(`SP-${sequence.toString().padStart(6, '0')}`)) sequence += 1
  return `SP-${sequence.toString().padStart(6, '0')}`
}
