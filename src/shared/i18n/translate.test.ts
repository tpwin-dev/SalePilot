import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('returns an English message', () => {
    expect(translate('en', 'stock.title')).toBe('Add stock')
  })

  it('returns a Myanmar message', () => {
    expect(translate('my', 'stock.title')).toBe('ကုန်လက်ကျန်ထည့်ရန်')
  })
})
