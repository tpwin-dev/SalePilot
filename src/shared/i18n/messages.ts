export const englishMessages = {
  'app.name': 'SalePilot',
  'app.tagline': 'Universal point of sale',
} as const

export type MessageKey = keyof typeof englishMessages

export const messages: Record<'en' | 'my', Record<MessageKey, string>> = {
  en: englishMessages,
  my: {
    'app.name': 'SalePilot',
    'app.tagline': 'လုပ်ငန်းမျိုးစုံသုံး အရောင်းစနစ်',
  },
}

export type Locale = keyof typeof messages
