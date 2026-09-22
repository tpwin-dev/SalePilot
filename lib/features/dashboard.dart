import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/auth.dart';
import '../shared/preferences.dart';
import 'inventory_screen.dart';

class Dashboard extends ConsumerStatefulWidget {
  const Dashboard({super.key});
  @override
  ConsumerState<Dashboard> createState() => _DashboardState();
}

class _DashboardState extends ConsumerState<Dashboard> {
  String active = 'nav.overview';
  static const nav = <(String, IconData)>[
    ('nav.overview', Icons.grid_view_rounded),
    ('nav.pos', Icons.point_of_sale_outlined),
    ('nav.orders', Icons.receipt_long_outlined),
    ('nav.products', Icons.layers_outlined),
    ('nav.customers', Icons.people_outline),
    ('nav.inventory', Icons.inventory_2_outlined),
    ('nav.analytics', Icons.bar_chart_outlined),
    ('nav.reports', Icons.description_outlined),
  ];
  @override
  Widget build(BuildContext context) {
    final p = ref.watch(preferencesProvider),
        t = p.t,
        user = ref.watch(authProvider);
    final wide = MediaQuery.sizeOf(context).width >= 900;
    final navPanel = Container(
      width: 260,
      color: p.theme == ThemeMode.light
          ? const Color(0xff18181b)
          : const Color(0xff0c0c0e),
      child: Theme(
        data: ThemeData.dark().copyWith(
          listTileTheme: const ListTileThemeData(
            textColor: Color(0xffa1a1aa),
            iconColor: Color(0xffa1a1aa),
            selectedColor: Colors.white,
            selectedTileColor: Color(0xff27272a),
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(24),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: const Text(
                        'S',
                        style: TextStyle(color: Colors.white),
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
              ),
              Expanded(
                child: ListView(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                      child: Text(t('nav.workspace')),
                    ),
                    for (final item in nav.take(6))
                      ListTile(
                        leading: Icon(item.$2),
                        title: Text(t(item.$1)),
                        selected: active == item.$1,
                        onTap: () {
                          setState(() => active = item.$1);
                          if (!wide) Navigator.pop(context);
                        },
                      ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                      child: Text(t('nav.insights')),
                    ),
                    for (final item in nav.skip(6))
                      ListTile(
                        leading: Icon(item.$2),
                        title: Text(t(item.$1)),
                        selected: active == item.$1,
                        onTap: () {
                          setState(() => active = item.$1);
                          if (!wide) Navigator.pop(context);
                        },
                      ),
                  ],
                ),
              ),
              const Divider(),
              ListTile(
                leading: const CircleAvatar(child: Icon(Icons.person_outline)),
                title: Text(user?.displayName ?? ''),
                subtitle: Text(t('user.owner')),
                trailing: IconButton(
                  tooltip: t('auth.logout'),
                  onPressed: () => ref.read(authProvider.notifier).logout(),
                  icon: const Icon(Icons.logout),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    return Scaffold(
      drawer: wide ? null : Drawer(child: navPanel),
      body: Row(
        children: [
          if (wide) navPanel,
          Expanded(
            child: SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 12),
                    child: Row(
                      children: [
                        if (!wide)
                          Builder(
                            builder: (ctx) => IconButton(
                              tooltip: t('nav.open'),
                              onPressed: () => Scaffold.of(ctx).openDrawer(),
                              icon: const Icon(Icons.menu),
                            ),
                          ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                MaterialLocalizations.of(context)
                                    .formatFullDate(DateTime.now()),
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              Text(
                                t('header.greeting', {
                                  'name': user?.displayName ?? '',
                                }),
                                style: Theme.of(context).textTheme.titleLarge
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => ref
                              .read(preferencesProvider.notifier)
                              .toggleLocale(),
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
                          onPressed: () => ref
                              .read(preferencesProvider.notifier)
                              .toggleTheme(),
                          icon: Icon(
                            p.theme == ThemeMode.light
                                ? Icons.dark_mode_outlined
                                : Icons.light_mode_outlined,
                          ),
                        ),
                        if (wide)
                          FilledButton.icon(
                            onPressed: () => setState(() => active = 'nav.pos'),
                            icon: const Icon(Icons.add),
                            label: Text(t('header.newSale')),
                          ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: active == 'nav.inventory' || active == 'nav.products'
                        ? const InventoryScreen()
                        : const OverviewScreen(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class OverviewScreen extends ConsumerWidget {
  const OverviewScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = ref.watch(preferencesProvider).t;
    final isWide = MediaQuery.sizeOf(context).width > 650;
    Widget card(String title, String value, IconData icon) => Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: Text(t(title))),
                Icon(icon),
              ],
            ),
            const SizedBox(height: 20),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('0% ${t('dashboard.fromYesterday')}'),
          ],
        ),
      ),
    );
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              for (final entry in [
                ('dashboard.grossSales', '\$0.00', Icons.trending_up),
                ('dashboard.orders', '0', Icons.receipt_outlined),
                ('dashboard.customers', '0', Icons.people_outline),
                ('dashboard.averageOrder', '\$0.00', Icons.donut_large),
              ])
                SizedBox(
                  width: isWide
                      ? 220
                      : (MediaQuery.sizeOf(context).width - 56) / 2,
                  child: card(entry.$1, entry.$2, entry.$3),
                ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              SizedBox(
                width: isWide ? 520 : double.infinity,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('dashboard.salesOverview'),
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(t('dashboard.weekRevenue')),
                        const SizedBox(height: 30),
                        SizedBox(
                          height: 160,
                          child: CustomPaint(
                            painter: _FlatChartPainter(
                              Theme.of(context).colorScheme.primary,
                            ),
                            child: const SizedBox.expand(),
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            for (final day in [
                              'mon',
                              'tue',
                              'wed',
                              'thu',
                              'fri',
                              'sat',
                              'sun',
                            ])
                              Text(t('day.$day')),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              SizedBox(
                width: isWide ? 330 : double.infinity,
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t('dashboard.topCategories'),
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        Text(t('dashboard.salesDistribution')),
                        const SizedBox(height: 24),
                        Center(
                          child: SizedBox(
                            width: 150,
                            height: 150,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                CircularProgressIndicator(
                                  value: 1,
                                  strokeWidth: 14,
                                  color: Theme.of(context)
                                      .colorScheme
                                      .surfaceContainerHighest,
                                ),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '\$0',
                                      style: Theme.of(context)
                                          .textTheme
                                          .headlineMedium,
                                    ),
                                    Text(t('dashboard.total')),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        for (final key in [
                          'electronics',
                          'apparel',
                          'home',
                          'other',
                        ])
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4),
                            child: Row(
                              children: [
                                Expanded(child: Text(t('category.$key'))),
                                const Text('0%'),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    t('dashboard.recentOrders'),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  Text(t('dashboard.latestSales')),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FlatChartPainter extends CustomPainter {
  final Color color;
  _FlatChartPainter(this.color);
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: .45)
      ..strokeWidth = 2;
    for (var i = 0; i < 4; i++) {
      final y = size.height * i / 3;
      canvas.drawLine(
        Offset.zero.translate(0, y),
        Offset(size.width, y),
        Paint()..color = color.withValues(alpha: .1),
      );
    }
    canvas.drawLine(
      Offset(0, size.height - 2),
      Offset(size.width, size.height - 2),
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant _FlatChartPainter oldDelegate) =>
      oldDelegate.color != color;
}
