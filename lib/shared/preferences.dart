import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'messages.dart';

class AppPreferences {
  final String locale;
  final ThemeMode theme;
  const AppPreferences(this.locale, this.theme);
  AppPreferences copyWith({String? locale, ThemeMode? theme}) =>
      AppPreferences(locale ?? this.locale, theme ?? this.theme);
  String t(String key, [Map<String, String> args = const {}]) {
    var value = messages[locale]?[key] ?? messages['en']?[key] ?? key;
    for (final entry in args.entries) {
      value = value.replaceAll('{${entry.key}}', entry.value);
    }
    return value;
  }
}

final preferencesProvider =
    NotifierProvider<PreferencesController, AppPreferences>(
      PreferencesController.new,
    );

class PreferencesController extends Notifier<AppPreferences> {
  @override
  AppPreferences build() {
    _load();
    return const AppPreferences('en', ThemeMode.light);
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    state = AppPreferences(
      prefs.getString('locale') ?? 'en',
      prefs.getBool('dark') == true ? ThemeMode.dark : ThemeMode.light,
    );
  }

  Future<void> toggleLocale() async {
    state = state.copyWith(locale: state.locale == 'en' ? 'my' : 'en');
    (await SharedPreferences.getInstance()).setString('locale', state.locale);
  }

  Future<void> toggleTheme() async {
    state = state.copyWith(
      theme: state.theme == ThemeMode.light ? ThemeMode.dark : ThemeMode.light,
    );
    (await SharedPreferences.getInstance()).setBool(
      'dark',
      state.theme == ThemeMode.dark,
    );
  }
}
