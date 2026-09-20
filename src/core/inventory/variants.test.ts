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
})
