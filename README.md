# SalePilot

Flutter inventory and sales app for Android, iOS, and web.

## Run

```sh
flutter pub get
flutter run
```

## Check

```sh
python3 tool_generate_messages.py
flutter analyze
flutter test
```

Authentication and inventory currently live only in memory and reset when the app closes. Language and theme preferences persist on the device. `InventoryRepository` and `AuthRepository` in `lib/core/` are the boundaries for future SQLite and Supabase implementations. Riverpod exposes the repositories and their current state directly; there are no use case or data source layers.

English and Myanmar messages are authored in `src/shared/i18n/messages.ts`. Run `python3 tool_generate_messages.py` after editing them to update `lib/shared/messages.dart`.
