import type { UnitDefinition } from './types'

export const units: readonly UnitDefinition[] = [
  {
    id: 'piece',
    code: 'EA',
    dimension: 'count',
    system: 'SI',
    name: 'Piece',
    symbol: 'pc',
    nameMy: 'ခု',
    symbolMy: 'ခု',
    decimalPlaces: 0,
    canonicalNumerator: '1',
    canonicalDenominator: '1',
  },
  {
    id: 'milligram',
    code: 'MGM',
    dimension: 'mass',
    system: 'SI',
    name: 'Milligram',
    symbol: 'mg',
    nameMy: 'မီလီဂရမ်',
    decimalPlaces: 3,
    canonicalNumerator: '1',
    canonicalDenominator: '1',
  },
  {
    id: 'gram',
    code: 'GRM',
    dimension: 'mass',
    system: 'SI',
    name: 'Gram',
    symbol: 'g',
    nameMy: 'ဂရမ်',
    decimalPlaces: 3,
    canonicalNumerator: '1000',
    canonicalDenominator: '1',
  },
  {
    id: 'kilogram',
    code: 'KGM',
    dimension: 'mass',
    system: 'SI',
    name: 'Kilogram',
    symbol: 'kg',
    nameMy: 'ကီလိုဂရမ်',
    decimalPlaces: 6,
    canonicalNumerator: '1000000',
    canonicalDenominator: '1',
  },
  {
    id: 'tical',
    code: 'MM-TICAL',
    dimension: 'mass',
    system: 'MYANMAR',
    name: 'Tical',
    symbol: 'tical',
    nameMy: 'ကျပ်သား',
    symbolMy: 'ကျပ်သား',
    decimalPlaces: 6,
    canonicalNumerator: '163293',
    canonicalDenominator: '10',
  },
  {
    id: 'viss',
    code: 'MM-VISS',
    dimension: 'mass',
    system: 'MYANMAR',
    name: 'Viss',
    symbol: 'viss',
    nameMy: 'ပိဿာ',
    symbolMy: 'ပိဿာ',
    decimalPlaces: 6,
    canonicalNumerator: '1632930',
    canonicalDenominator: '1',
  },
  {
    id: 'milliliter',
    code: 'MLT',
    dimension: 'volume',
    system: 'SI',
    name: 'Milliliter',
    symbol: 'ml',
    nameMy: 'မီလီလီတာ',
    decimalPlaces: 3,
    canonicalNumerator: '1',
    canonicalDenominator: '1',
  },
  {
    id: 'liter',
    code: 'LTR',
    dimension: 'volume',
    system: 'SI',
    name: 'Liter',
    symbol: 'L',
    nameMy: 'လီတာ',
    decimalPlaces: 6,
    canonicalNumerator: '1000',
    canonicalDenominator: '1',
  },
  {
    id: 'pyi',
    code: 'MM-PYI',
    dimension: 'volume',
    system: 'MYANMAR',
    name: 'Pyi',
    symbol: 'pyi',
    nameMy: 'ပြည်',
    symbolMy: 'ပြည်',
    decimalPlaces: 6,
    canonicalNumerator: '20457405',
    canonicalDenominator: '8000',
  },
  {
    id: 'basket',
    code: 'MM-BASKET',
    dimension: 'volume',
    system: 'MYANMAR',
    name: 'Basket',
    symbol: 'basket',
    nameMy: 'တင်း',
    symbolMy: 'တင်း',
    decimalPlaces: 6,
    canonicalNumerator: '4091481',
    canonicalDenominator: '100',
  },
  {
    id: 'millimeter',
    code: 'MMT',
    dimension: 'length',
    system: 'SI',
    name: 'Millimeter',
    symbol: 'mm',
    nameMy: 'မီလီမီတာ',
    decimalPlaces: 3,
    canonicalNumerator: '1',
    canonicalDenominator: '1',
  },
  {
    id: 'centimeter',
    code: 'CMT',
    dimension: 'length',
    system: 'SI',
    name: 'Centimeter',
    symbol: 'cm',
    nameMy: 'စင်တီမီတာ',
    decimalPlaces: 3,
    canonicalNumerator: '10',
    canonicalDenominator: '1',
  },
  {
    id: 'meter',
    code: 'MTR',
    dimension: 'length',
    system: 'SI',
    name: 'Meter',
    symbol: 'm',
    nameMy: 'မီတာ',
    decimalPlaces: 6,
    canonicalNumerator: '1000',
    canonicalDenominator: '1',
  },
]

const customNames: Readonly<
  Record<string, { name: string; nameMy?: string; symbol: string }>
> = {
  bag: { name: 'Bag', nameMy: 'အိတ်', symbol: 'bag' },
  bottle: { name: 'Bottle', nameMy: 'ပုလင်း', symbol: 'btl' },
  pack: { name: 'Pack', nameMy: 'ထုပ်', symbol: 'pack' },
  case: { name: 'Case', nameMy: 'ဖာ', symbol: 'case' },
}

export function getUnitLabel(unitId: string): string {
  const unit = units.find(({ id }) => id === unitId)
  if (unit) return unit.nameMy ? `${unit.name} · ${unit.nameMy}` : unit.name
  const custom = customNames[unitId]
  return custom?.nameMy
    ? `${custom.name} · ${custom.nameMy}`
    : (custom?.name ?? unitId)
}

export function getUnitSymbol(unitId: string): string {
  return (
    units.find(({ id }) => id === unitId)?.symbol ??
    customNames[unitId]?.symbol ??
    unitId
  )
}
