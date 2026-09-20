import { messages, type Locale, type MessageKey } from './messages'

export function translate(
  locale: Locale,
  key: MessageKey,
  values?: Readonly<Record<string, string>>,
): string {
  const message = messages[locale][key]
  if (!values) return message
  return Object.entries(values).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, value),
    message,
  )
}
