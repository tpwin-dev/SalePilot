import { describe, expect, it } from 'vitest'
import { buildVariantCombinations } from './variants'

describe('buildVariantCombinations', () => {
  it('creates every option combination', () => {
    const result = buildVariantCombinations([
      { id: 'color', name: 'Color', values: ['Black', 'White'] },
      { id: 'size', name: 'Size', values: ['S', 'M'] },
    ])
    expect(result.map(({ label }) => label)).toEqual([
      'Black / S',
      'Black / M',
      'White / S',
      'White / M',
    ])
  })

  it('supports additional dimensions without clothing-specific assumptions', () => {
    const result = buildVariantCombinations([
      { id: 'color', name: 'Color', values: ['Black', 'White'] },
      { id: 'size', name: 'Size', values: ['S', 'M'] },
      { id: 'material', name: 'Material', values: ['Cotton', 'Linen'] },
    ])
    expect(result).toHaveLength(8)
    expect(result[0]?.options).toEqual({
      Color: 'Black',
      Size: 'S',
      Material: 'Cotton',
    })
  })
})
