import { describe, expect, it } from 'vitest'
import { translate } from './translate'

describe('translate', () => {
  it('returns an English message', () => {
    expect(translate('en', 'app.tagline')).toBe('Universal point of sale')
  })

  it('returns a Myanmar message', () => {
    expect(translate('my', 'app.tagline')).toBe(
      'လုပ်ငန်းမျိုးစုံသုံး အရောင်းစနစ်',
    )
  })
})
