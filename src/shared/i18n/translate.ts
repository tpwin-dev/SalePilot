import { messages, type Locale, type MessageKey } from './messages'

export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key]
}
