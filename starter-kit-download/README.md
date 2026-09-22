# SalePilot

A new Flutter app for sales and inventory across Android, iOS, desktop, and web.

## Start

1. Create a new Flutter project named `sale_pilot` in a separate folder.
2. Copy `AGENTS.md` and `PRODUCT.md` into its root folder.
3. Build the first feature listed in `PRODUCT.md`.

## Development commands

```sh
flutter pub get
flutter run
flutter analyze
flutter test
```

## Initial architecture

- `lib/features/` — screens and feature widgets
- `lib/core/` — models, exact inventory calculations, and repository interfaces
- `lib/shared/` — translations, theme, and reusable UI

For now, repositories store app data in memory. Language and theme preferences may persist on the device. SQLite and Supabase will be added later behind the same repository interfaces.
