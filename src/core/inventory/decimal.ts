interface DecimalParts {
  readonly coefficient: bigint
  readonly scale: number
}

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/

function parseDecimal(value: string): DecimalParts {
  const normalized = value.trim()
  const match = DECIMAL_PATTERN.exec(normalized)
  if (!match) throw new Error(`Invalid decimal value: ${value}`)

  const sign = match[1] === '-' ? -1n : 1n
  const whole = match[2] ?? '0'
  const fraction = match[3] ?? ''
  return {
    coefficient: sign * BigInt(`${whole}${fraction}`),
    scale: fraction.length,
  }
}

function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent)
}

export function normalizeDecimal(value: string): string {
  const { coefficient, scale } = parseDecimal(value)
  return formatDecimal(coefficient, scale)
}

export function multiplyDecimals(left: string, right: string): string {
  const a = parseDecimal(left)
  const b = parseDecimal(right)
  return formatDecimal(a.coefficient * b.coefficient, a.scale + b.scale)
}

export function compareDecimal(left: string, right: string): number {
  const a = parseDecimal(left)
  const b = parseDecimal(right)
  const scale = Math.max(a.scale, b.scale)
  const aValue = a.coefficient * powerOfTen(scale - a.scale)
  const bValue = b.coefficient * powerOfTen(scale - b.scale)
  return aValue === bValue ? 0 : aValue > bValue ? 1 : -1
}

export function formatDecimal(coefficient: bigint, scale: number): string {
  const negative = coefficient < 0
  const absolute = negative ? -coefficient : coefficient
  const padded = absolute.toString().padStart(scale + 1, '0')
  const whole = scale === 0 ? padded : padded.slice(0, -scale)
  const fraction = scale === 0 ? '' : padded.slice(-scale).replace(/0+$/, '')
  const result = fraction ? `${whole}.${fraction}` : whole
  return negative && result !== '0' ? `-${result}` : result
}
