# SalePilot product plan

## Goal

Create a simple sales and inventory app that works on Android, iOS, desktop, and web. Build and verify one feature before starting the next.

## Version 1

1. **App foundation** — responsive navigation, English/Myanmar language choice, light/dark theme, and in-memory repositories.
2. **Products** — create, edit, archive, and list products with SKU, category, selling price, base unit, and optional variants.
3. **Stock receiving** — select an existing product or create one; enter quantity, purchase unit, conversion, cost, supplier, location, and optional receipt details.
4. **Stock history** — show receipts, adjustments, balances, and corrections. Keep the original entry when reversing a receipt.
5. **Dashboard** — show real totals from in-memory data. Do not show invented sales numbers.
6. **Sales** — define and implement this flow after products and stock receiving are working.

## Inventory rules

- A product's balance is calculated only in its base unit.
- A receipt keeps the entered quantity, unit, and conversion as an audit snapshot.
- Money, quantity, and conversion calculations use exact decimal arithmetic.
- Product-specific packaging conversions are not global conversions.
- An SKU must be unique without regard to letter case.
- A product with history is archived instead of deleted.

## Completion check for each feature

- The flow works with English and Myanmar text.
- It works in light and dark themes.
- It is usable on phone and desktop widths.
- Important calculations and behavior have tests.
- `flutter analyze` and `flutter test` pass.

## Later

- SQLite storage for offline use.
- Supabase for accounts and synchronization.
- Decide conflict handling and offline synchronization rules before adding cloud sync.
