# SalePilot development rules

- Keep interface copy short, specific, and useful to an end user. Do not add promotional, architectural, or implementation language to the UI.
- Never hard-code user-visible text in components. This includes headings, labels, buttons, placeholders, validation messages, tooltips, accessibility labels, statuses, and empty states.
- Add every user-visible message to `src/shared/i18n/messages.ts` in both English (`en`) and Myanmar (`my`).
- Use message keys through the shared translation function or preferences hook. New languages must be addable by supplying another message dictionary without rewriting feature components.
- Keep user-generated data, identifiers, SKUs, quantities, and prices as data; do not put them in translation dictionaries.
- Preserve the selected language and theme between sessions.
- Every new interface must work in both light and dark themes. Use shared CSS color variables instead of hard-coded surface or text colors.
- Every page and dialog must be responsive and usable on mobile, tablet, laptop, and desktop screens. Avoid page-level horizontal scrolling, keep touch targets usable, and adapt dense tables into a mobile-friendly layout.
- Inventory calculations store quantities in the product's base unit. Preserve the entered unit and conversion only as an audit snapshot.
- Use exact decimal arithmetic for money, quantities, and unit conversions; never use floating-point arithmetic for inventory calculations.
- Support SI, imperial, Myanmar, packaging, and merchant-defined units. Product-specific packaging conversions must not be treated as global conversions.
