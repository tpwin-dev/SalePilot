import { describe, expect, it } from 'vitest'
import { resolveSku } from './sku'

describe('resolveSku', () => {
  it('normalizes a manually entered SKU', () => {
    expect(resolveSku(' tee-black-m ', [])).toBe('TEE-BLACK-M')
  })

  it('generates the next available SKU', () => {
    expect(resolveSku('', ['SP-000001', 'SP-000002'])).toBe('SP-000003')
  })

  it('rejects duplicate SKUs without case sensitivity', () => {
    expect(() => resolveSku('tee-1', ['TEE-1'])).toThrow('SKU_TAKEN')
  })
})
