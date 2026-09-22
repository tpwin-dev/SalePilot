import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/auth.dart';
import 'shared/preferences.dart';
import 'features/auth_screen.dart';
import 'features/dashboard.dart';

void main() => runApp(const ProviderScope(child: SalePilotApp()));

class SalePilotApp extends ConsumerWidget {
  const SalePilotApp({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final p = ref.watch(preferencesProvider);
    final seed = const Color(0xff4f46e5);
    ThemeData theme(Brightness brightness) => ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: seed,
        brightness: brightness,
      ),
      scaffoldBackgroundColor: brightness == Brightness.light
          ? const Color(0xfff8fafc)
          : const Color(0xff111113),
      cardTheme: CardThemeData(
        elevation: 0,
        color: brightness == Brightness.light
            ? Colors.white
            : const Color(0xff18181b),
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 13,
        ),
      ),
    );
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: p.t('app.name'),
      theme: theme(Brightness.light),
      darkTheme: theme(Brightness.dark),
      themeMode: p.theme,
      home: ref.watch(authProvider) == null
          ? const AuthScreen()
          : const Dashboard(),
    );
  }
}
