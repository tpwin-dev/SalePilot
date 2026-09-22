# SalePilot Flutter development rules

- Build one small, complete feature at a time.
- Use Flutter for Android, iOS, desktop, and web.
- Use Riverpod for state management and repository interfaces for data access.
- Keep the architecture simple: feature UI, models, and repositories. Do not add use-case or data-source layers.
- Keep app data in memory for now. Design repository interfaces so SQLite and Supabase can be added later without rewriting screens.
- Keep interface text short and useful. Put every user-visible string in English and Myanmar translation dictionaries. Do not hard-code interface text in widgets.
- Preserve the selected language and theme between sessions.
- Support light and dark themes. Make every screen usable on phone, tablet, and desktop widths.
- Use exact decimal arithmetic for money, quantities, and unit conversions. Never use floating-point arithmetic for inventory balances.
- Store inventory quantities in each product's base unit. Preserve the entered unit and conversion in receipt history.
- Support SI, imperial, Myanmar, packaging, and merchant-defined units. Packaging conversions belong to a product, not a global unit table.
- Add meaningful tests for inventory calculations and important user flows. Run `flutter analyze` and `flutter test` before declaring a feature complete.
- If a requirement is unclear, implement the safe, simple part and identify the decision needed.
