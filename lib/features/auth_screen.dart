import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth.dart';
import '../shared/preferences.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});
  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool register = false;
  String error = '';
  final username = TextEditingController(),
      name = TextEditingController(),
      password = TextEditingController(),
      confirmation = TextEditingController();
  @override
  void dispose() {
    username.dispose();
    name.dispose();
    password.dispose();
    confirmation.dispose();
    super.dispose();
  }

  void submit() {
    final t = ref.read(preferencesProvider).t;
    setState(() => error = '');
    if (username.text.trim().isEmpty ||
        password.text.isEmpty ||
        register && name.text.trim().isEmpty) {
      setState(() => error = t('auth.required'));
      return;
    }
    if (password.text.length < 8) {
      setState(() => error = t('auth.passwordLength'));
      return;
    }
    if (register && password.text != confirmation.text) {
      setState(() => error = t('auth.passwordMismatch'));
      return;
    }
    try {
      if (register) {
        ref
            .read(authProvider.notifier)
            .register(username.text, name.text, password.text);
      } else {
        ref.read(authProvider.notifier).login(username.text, password.text);
      }
    } catch (e) {
      setState(
        () => error = t(
          e.toString().contains('USERNAME_TAKEN')
              ? 'auth.usernameTaken'
              : 'auth.invalid',
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = ref.watch(preferencesProvider), t = p.t;
    return Scaffold(
      body: SafeArea(
        child: Stack(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextButton(
                      onPressed: () =>
                          ref.read(preferencesProvider.notifier).toggleLocale(),
                      child: Text(
                        t(
                          p.locale == 'en'
                              ? 'preference.myanmar'
                              : 'preference.english',
                        ),
                      ),
                    ),
                    IconButton(
                      tooltip: t('preference.theme'),
                      onPressed: () =>
                          ref.read(preferencesProvider.notifier).toggleTheme(),
                      icon: Icon(
                        p.theme == ThemeMode.light
                            ? Icons.dark_mode_outlined
                            : Icons.light_mode_outlined,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 390),
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(30),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Theme.of(context)
                                    .colorScheme
                                    .primary,
                                child: const Text(
                                  'S',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                t('app.name'),
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 28),
                          Text(
                            t(register ? 'auth.register' : 'auth.login'),
                            style: Theme.of(context).textTheme.headlineMedium,
                          ),
                          const SizedBox(height: 24),
                          if (register) ...[
                            TextField(
                              controller: name,
                              decoration: InputDecoration(
                                labelText: t('auth.displayName'),
                              ),
                            ),
                            const SizedBox(height: 14),
                          ],
                          TextField(
                            controller: username,
                            decoration: InputDecoration(
                              labelText: t('auth.username'),
                            ),
                          ),
                          const SizedBox(height: 14),
                          TextField(
                            controller: password,
                            obscureText: true,
                            decoration: InputDecoration(
                              labelText: t('auth.password'),
                            ),
                            onSubmitted: (_) => submit(),
                          ),
                          if (register) ...[
                            const SizedBox(height: 14),
                            TextField(
                              controller: confirmation,
                              obscureText: true,
                              decoration: InputDecoration(
                                labelText: t('auth.confirmPassword'),
                              ),
                            ),
                          ],
                          if (error.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Text(
                              error,
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.error,
                              ),
                            ),
                          ],
                          const SizedBox(height: 22),
                          FilledButton(
                            onPressed: submit,
                            child: Text(
                              t(register ? 'auth.register' : 'auth.login'),
                            ),
                          ),
                          TextButton(
                            onPressed: () => setState(() {
                              register = !register;
                              error = '';
                            }),
                            child: Text(
                              t(
                                register
                                    ? 'auth.haveAccount'
                                    : 'auth.noAccount',
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
