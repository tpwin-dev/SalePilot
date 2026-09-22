import 'package:decimal/decimal.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../core/inventory.dart';
import '../shared/preferences.dart';

final _uuid = Uuid();

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});
  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  bool showArchived = false;
  String? notice;
  void message(String text) {
    setState(() => notice = text);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(inventoryProvider),
        t = ref.watch(preferencesProvider).t;
    final products = s.products
        .where((p) => (p.archivedAt != null) == showArchived)
        .toList();
    final archived = s.products.where((p) => p.archivedAt != null).length;
    final groups = <String, List<Product>>{};
    for (final p in products) {
      groups.putIfAbsent(p.familyId, () => []).add(p);
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 12,
            runSpacing: 10,
            children: [
              Text(
                t('inventory.title'),
                style: Theme.of(context).textTheme.headlineMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (archived > 0)
                    OutlinedButton(
                      onPressed: () =>
                          setState(() => showArchived = !showArchived),
                      child: Text(
                        showArchived
                            ? t('inventory.showActive')
                            : t('inventory.showArchived', {
                                'count': '$archived',
                              }),
                      ),
                    ),
                  if (!showArchived) ...[
                    const SizedBox(width: 8),
                    FilledButton.icon(
                      onPressed: () => showDialog(
                        context: context,
                        builder: (_) => const _AddStockDialog(),
                      ),
                      icon: const Icon(Icons.add),
                      label: Text(t('stock.addAction')),
                    ),
                  ],
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (products.isEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(35),
                child: Center(child: Text(t('inventory.empty'))),
              ),
            ),
          for (final group in groups.values)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                group.first.name,
                                style: Theme.of(context).textTheme.titleMedium
                                    ?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                group.first.categoryName ?? t('category.none'),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => _showHistory(group),
                          child: Text(t('stock.allHistory')),
                        ),
                      ],
                    ),
                    const Divider(),
                    for (final p in group)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            final details = Wrap(
                              spacing: 20,
                              runSpacing: 8,
                              children: [
                                _datum(
                                  t('variant.name'),
                                  p.variantName ?? t('variant.standard'),
                                ),
                                _datum(t('stock.sku'), p.sku),
                                _datum(
                                  t('stock.onHand'),
                                  '${s.onHand(p.id)} ${unitSymbols[p.baseUnitId] ?? p.baseUnitId}',
                                ),
                                _datum(
                                  t('stock.averageCost'),
                                  s.averageCost(p.id) ??
                                      t('common.notAvailable'),
                                ),
                                _datum(t('stock.sellingPrice'), p.sellingPrice),
                              ],
                            );
                            final actions = Wrap(
                              spacing: 4,
                              children: [
                                TextButton(
                                  onPressed: () => _showHistory([p]),
                                  child: Text(t('stock.historyAction')),
                                ),
                                TextButton(
                                  onPressed: () => _edit(p),
                                  child: Text(t('inventory.edit')),
                                ),
                                TextButton(
                                  onPressed: () => _remove(p),
                                  child: Text(
                                    t(
                                      p.archivedAt != null
                                          ? 'inventory.restore'
                                          : s.movements.any(
                                              (m) => m.productId == p.id,
                                            )
                                          ? 'inventory.archive'
                                          : 'inventory.delete',
                                    ),
                                  ),
                                ),
                              ],
                            );
                            return constraints.maxWidth > 650
                                ? Row(
                                    children: [
                                      Expanded(child: details),
                                      actions,
                                    ],
                                  )
                                : Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [details, actions],
                                  );
                          },
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _datum(String label, String value) => SizedBox(
    width: 105,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: Theme.of(context).textTheme.labelSmall),
        Text(value, overflow: TextOverflow.ellipsis),
      ],
    ),
  );
  void _remove(Product p) {
    final s = ref.read(inventoryProvider), t = ref.read(preferencesProvider).t;
    final hasHistory = s.movements.any((m) => m.productId == p.id);
    if (p.archivedAt != null) {
      ref.read(inventoryProvider.notifier).update(p.copyWith(restore: true));
      message(t('inventory.restored'));
      return;
    }
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
          t(hasHistory ? 'inventory.archiveTitle' : 'inventory.deleteTitle'),
        ),
        content: Text(
          t(
            hasHistory ? 'inventory.archiveConfirm' : 'inventory.deleteConfirm',
            {'product': p.name},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(t('stock.cancel')),
          ),
          FilledButton(
            onPressed: () {
              if (hasHistory) {
                ref
                    .read(inventoryProvider.notifier)
                    .update(
                      p.copyWith(archivedAt: DateTime.now().toIso8601String()),
                    );
              } else {
                ref.read(inventoryProvider.notifier).delete(p.id);
              }
              Navigator.pop(ctx);
              message(
                t(hasHistory ? 'inventory.archived' : 'inventory.deleted'),
              );
            },
            child: Text(
              t(hasHistory ? 'inventory.archive' : 'inventory.delete'),
            ),
          ),
        ],
      ),
    );
  }

  void _edit(Product p) {
    showDialog(
      context: context,
      builder: (_) => _EditDialog(product: p),
    );
  }

  void _showHistory(List<Product> products) {
    showDialog(
      context: context,
      builder: (_) => _HistoryDialog(products: products),
    );
  }
}

class _AddStockDialog extends ConsumerStatefulWidget {
  const _AddStockDialog();
  @override
  ConsumerState<_AddStockDialog> createState() => _AddStockDialogState();
}

class _VariantGroup {
  final name = TextEditingController();
  final choices = TextEditingController();
  void dispose() {
    name.dispose();
    choices.dispose();
  }
}

class _AddStockDialogState extends ConsumerState<_AddStockDialog> {
  final name = TextEditingController(),
      sku = TextEditingController(),
      newCategory = TextEditingController(),
      customUnit = TextEditingController(),
      conversion = TextEditingController(text: '1'),
      quantity = TextEditingController(),
      cost = TextEditingController(),
      price = TextEditingController(),
      note = TextEditingController(),
      newSupplier = TextEditingController(),
      newLocation = TextEditingController(),
      reference = TextEditingController(),
      batch = TextEditingController();
  String? productId, category, supplier, location;
  String baseUnit = 'piece', purchaseUnit = 'piece';
  bool details = false, variants = false;
  final optionGroups = <_VariantGroup>[_VariantGroup()];
  final variantQuantities = <String, TextEditingController>{},
      variantSkus = <String, TextEditingController>{},
      variantCosts = <String, TextEditingController>{},
      variantPrices = <String, TextEditingController>{};
  DateTime? expiry;
  String? error;
  @override
  void dispose() {
    for (final group in optionGroups) {
      group.dispose();
    }
    for (final c in [
      name,
      sku,
      newCategory,
      customUnit,
      conversion,
      quantity,
      cost,
      price,
      note,
      newSupplier,
      newLocation,
      reference,
      batch,
      ...variantQuantities.values,
      ...variantSkus.values,
      ...variantCosts.values,
      ...variantPrices.values,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void save() {
    final t = ref.read(preferencesProvider).t, s = ref.read(inventoryProvider);
    try {
      if (location == null ||
          location == '__new__' && newLocation.text.trim().isEmpty) {
        throw FormatException('INVALID');
      }
      final selected = s.products.where((p) => p.id == productId).firstOrNull;
      if (supplier == '__new__' && newSupplier.text.trim().isEmpty) {
        throw FormatException('INVALID');
      }
      if (selected == null &&
          (name.text.trim().isEmpty ||
              category == '__new__' && newCategory.text.trim().isEmpty ||
              purchaseUnit == 'custom' && customUnit.text.trim().isEmpty)) {
        throw FormatException('INVALID');
      }
      if ((selected != null || !variants) &&
              (quantity.text.trim().isEmpty ||
                  cost.text.trim().isEmpty ||
                  decimal(quantity.text) <= Decimal.zero ||
                  decimal(cost.text) < Decimal.zero) ||
          selected == null &&
              (conversion.text.trim().isEmpty ||
                  decimal(conversion.text) <= Decimal.zero ||
                  !variants &&
                      (price.text.trim().isEmpty ||
                          decimal(price.text) < Decimal.zero))) {
        throw FormatException('INVALID');
      }
      final loc = location == '__new__' ? newLocation.text.trim() : location;
      final sup = supplier == '__new__' ? newSupplier.text.trim() : supplier;
      if (location == '__new__') {
        ref.read(inventoryProvider.notifier).addLocation(loc!);
      }
      if (supplier == '__new__') {
        ref.read(inventoryProvider.notifier).addSupplier(sup!);
      }
      if (category == '__new__') {
        ref
            .read(inventoryProvider.notifier)
            .addCategory(newCategory.text.trim());
      }
      final cat = category == '__new__' ? newCategory.text.trim() : category;
      if (selected == null && variants) {
        final options = _combinations();
        if (options.isEmpty) throw FormatException('INVALID');
        final family = _uuid.v4();
        for (final option in options) {
          final label = option.values.join(' / ');
          final q = variantQuantities[label]?.text ?? quantity.text;
          final c = variantCosts[label]?.text ?? cost.text;
          final p = variantPrices[label]?.text ?? price.text;
          if (q.trim().isEmpty ||
              c.trim().isEmpty ||
              p.trim().isEmpty ||
              decimal(q) <= Decimal.zero ||
              decimal(c) < Decimal.zero ||
              decimal(p) < Decimal.zero) {
            throw FormatException('INVALID');
          }
          final product = _newProduct(
            cat,
            familyId: family,
            variantName: label,
            variantOptions: option,
            variantSku: variantSkus[label]?.text,
            variantPrice: p,
          );
          ref
              .read(inventoryProvider.notifier)
              .addReceipt(
                product: product,
                unit: product.units.last,
                quantity: q,
                unitCost: c,
                location: loc,
                supplier: sup,
                reference: reference.text.trim(),
                batch: batch.text.trim(),
                expiry: expiry?.toIso8601String(),
                note: note.text.trim(),
                commandId: _uuid.v4(),
                addProduct: true,
              );
        }
        if (mounted) {
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                t('stock.variantsSaved', {'count': '${options.length}'}),
              ),
            ),
          );
        }
        return;
      }
      final product = selected ?? _newProduct(cat);
      final unit = selected == null
          ? product.units.last
          : product.units.firstWhere(
              (u) => u.id == purchaseUnit,
              orElse: () => product.units.first,
            );
      ref
          .read(inventoryProvider.notifier)
          .addReceipt(
            product: product,
            unit: unit,
            quantity: quantity.text,
            unitCost: cost.text,
            location: loc,
            supplier: sup,
            reference: reference.text.trim(),
            batch: batch.text.trim(),
            expiry: expiry?.toIso8601String(),
            note: note.text.trim(),
            actor: null,
            commandId: _uuid.v4(),
            addProduct: selected == null,
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              t('stock.saved', {
                'quantity': exact(
                  decimal(quantity.text) * decimal(unit.baseQuantity),
                ),
                'unit': unitSymbols[product.baseUnitId] ?? product.baseUnitId,
              }),
            ),
          ),
        );
      }
    } catch (e) {
      setState(
        () => error = t(
          e.toString().contains('SKU_TAKEN')
              ? 'stock.skuTaken'
              : 'stock.invalid',
        ),
      );
    }
  }

  List<Map<String, String>> _combinations() {
    var result = <Map<String, String>>[{}];
    final names = <String>{};
    for (final group in optionGroups) {
      final name = group.name.text.trim();
      final values = group.choices.text
          .split(',')
          .map((v) => v.trim())
          .where((v) => v.isNotEmpty)
          .toSet();
      if (name.isEmpty || values.isEmpty || !names.add(name.toLowerCase())) {
        return [];
      }
      result = [
        for (final combination in result)
          for (final value in values) {...combination, name: value},
      ];
    }
    return result;
  }

  Product _newProduct(
    String? category, {
    String? familyId,
    String? variantName,
    Map<String, String> variantOptions = const {},
    String? variantSku,
    String? variantPrice,
  }) {
    final id = _uuid.v4();
    final base = ProductUnit(
      id: '$id-base',
      unitId: baseUnit,
      baseQuantity: '1',
    );
    final entered = purchaseUnit == 'custom'
        ? 'custom:${customUnit.text.trim().toLowerCase()}'
        : purchaseUnit;
    final units = <ProductUnit>[base];
    if (entered != baseUnit || decimal(conversion.text) != Decimal.one) {
      units.add(
        ProductUnit(
          id: '$id-purchase',
          unitId: entered,
          baseQuantity: exact(decimal(conversion.text)),
          unitName: purchaseUnit == 'custom' ? customUnit.text.trim() : null,
          canSell: false,
        ),
      );
    }
    return Product(
      id: id,
      familyId: familyId ?? id,
      name: name.text.trim(),
      sku: resolveSku(
        variantSku ?? sku.text,
        ref.read(inventoryProvider).products.map((p) => p.sku),
      ),
      baseUnitId: baseUnit,
      sellingPrice: exact(decimal(variantPrice ?? price.text)),
      units: units,
      categoryName: category,
      variantName: variantName,
      variantOptions: variantOptions,
    );
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(inventoryProvider),
        t = ref.watch(preferencesProvider).t,
        selected = s.products.where((p) => p.id == productId).firstOrNull;
    final dialogWidth = MediaQuery.sizeOf(context).width > 700
        ? 660.0
        : MediaQuery.sizeOf(context).width - 24;
    Widget field(String key, TextEditingController c, {bool numeric = false}) =>
        TextField(
          controller: c,
          keyboardType: numeric
              ? const TextInputType.numberWithOptions(decimal: true)
              : TextInputType.text,
          decoration: InputDecoration(labelText: t(key)),
        );
    Widget pick(
      String key,
      String? value,
      List<(String?, String)> options,
      ValueChanged<String?> change,
    ) => DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: t(key)),
      items: [
        for (final o in options)
          DropdownMenuItem(
            value: o.$1,
            child: Text(o.$2, overflow: TextOverflow.ellipsis),
          ),
      ],
      onChanged: change,
    );
    final unitOptions = [for (final id in unitIds) (id, t('unit.$id'))];
    return Dialog(
      child: SizedBox(
        width: dialogWidth,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      t('stock.title'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    tooltip: t('stock.close'),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    pick(
                      'stock.product',
                      productId,
                      [
                        (null, t('stock.newProduct')),
                        for (final p in s.products.where(
                          (p) => p.archivedAt == null,
                        ))
                          (
                            p.id,
                            p.variantName == null
                                ? p.name
                                : '${p.name} · ${p.variantName}',
                          ),
                      ],
                      (v) => setState(() {
                        productId = v;
                        purchaseUnit =
                            s.products
                                .where((p) => p.id == v)
                                .firstOrNull
                                ?.units
                                .first
                                .id ??
                            'piece';
                      }),
                    ),
                    const SizedBox(height: 12),
                    if (selected == null) ...[
                      field('stock.productName', name),
                      const SizedBox(height: 12),
                      if (!variants) field('stock.sku', sku),
                      SwitchListTile(
                        title: Text(t('variant.hasVariants')),
                        value: variants,
                        onChanged: (v) => setState(() => variants = v),
                      ),
                      if (variants) ...[
                        for (final group in optionGroups) ...[
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: group.name,
                                  onChanged: (_) => setState(() {}),
                                  decoration: InputDecoration(
                                    labelText: t('variant.option'),
                                  ),
                                ),
                              ),
                              if (optionGroups.length > 1)
                                IconButton(
                                  tooltip: t('variant.removeOption'),
                                  onPressed: () => setState(() {
                                    optionGroups.remove(group);
                                    group.dispose();
                                  }),
                                  icon: const Icon(Icons.close),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: group.choices,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              labelText: t('variant.choices'),
                              hintText: t('variant.choiceExample'),
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                        TextButton.icon(
                          onPressed: () =>
                              setState(() => optionGroups.add(_VariantGroup())),
                          icon: const Icon(Icons.add),
                          label: Text(t('variant.addAnotherOption')),
                        ),
                        const SizedBox(height: 12),
                        for (final option in _combinations())
                          Card(
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(option.values.join(' / ')),
                                  const SizedBox(height: 8),
                                  TextField(
                                    controller: variantSkus.putIfAbsent(
                                      option.values.join(' / '),
                                      () => TextEditingController(),
                                    ),
                                    decoration: InputDecoration(
                                      labelText: t('stock.sku'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextField(
                                    controller: variantQuantities.putIfAbsent(
                                      option.values.join(' / '),
                                      () => TextEditingController(),
                                    ),
                                    decoration: InputDecoration(
                                      labelText: t('variant.quantity'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextField(
                                    controller: variantCosts.putIfAbsent(
                                      option.values.join(' / '),
                                      () => TextEditingController(),
                                    ),
                                    decoration: InputDecoration(
                                      labelText: t('stock.cost'),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextField(
                                    controller: variantPrices.putIfAbsent(
                                      option.values.join(' / '),
                                      () => TextEditingController(),
                                    ),
                                    decoration: InputDecoration(
                                      labelText: t('stock.sellingPrice'),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                      const SizedBox(height: 12),
                      pick('category.label', category, [
                        (null, t('category.none')),
                        for (final c in s.categories) (c, c),
                        ('__new__', t('category.create')),
                      ], (v) => setState(() => category = v)),
                      if (category == '__new__') ...[
                        const SizedBox(height: 12),
                        field('category.name', newCategory),
                      ],
                      const SizedBox(height: 12),
                      pick(
                        'stock.baseUnit',
                        baseUnit,
                        unitOptions,
                        (v) => setState(() => baseUnit = v ?? 'piece'),
                      ),
                      const SizedBox(height: 12),
                      pick(
                        'stock.purchaseUnit',
                        purchaseUnit,
                        unitOptions,
                        (v) => setState(() => purchaseUnit = v ?? 'piece'),
                      ),
                      if (purchaseUnit == 'custom') ...[
                        const SizedBox(height: 12),
                        field('stock.customUnitName', customUnit),
                      ],
                      const SizedBox(height: 12),
                      field('stock.conversion', conversion, numeric: true),
                      const SizedBox(height: 12),
                      if (!variants) ...[
                        field('stock.sellingPrice', price, numeric: true),
                        const SizedBox(height: 12),
                      ],
                    ] else ...[
                      pick(
                        'stock.purchaseUnit',
                        purchaseUnit,
                        [
                          (null, t('stock.unit')),
                          for (final u in selected.units)
                            (u.id, u.unitName ?? t('unit.${u.unitId}')),
                        ],
                        (v) => setState(
                          () => purchaseUnit = v ?? selected.units.first.id,
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],
                    if (selected != null || !variants) ...[
                      field('stock.quantity', quantity, numeric: true),
                      const SizedBox(height: 12),
                      field('stock.cost', cost, numeric: true),
                      const SizedBox(height: 12),
                    ],
                    pick('stock.location', location, [
                      (null, t('stock.location')),
                      for (final v in s.locations) (v, v),
                      ('__new__', t('stock.newLocation')),
                    ], (v) => setState(() => location = v)),
                    if (location == '__new__') ...[
                      const SizedBox(height: 12),
                      field('stock.locationName', newLocation),
                    ],
                    const SizedBox(height: 12),
                    pick('stock.supplier', supplier, [
                      (null, t('stock.optional')),
                      for (final v in s.suppliers) (v, v),
                      ('__new__', t('stock.newSupplier')),
                    ], (v) => setState(() => supplier = v)),
                    if (supplier == '__new__') ...[
                      const SizedBox(height: 12),
                      field('stock.supplierName', newSupplier),
                    ],
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => setState(() => details = !details),
                      child: Text(t('stock.receiptDetails')),
                    ),
                    if (details) ...[
                      field('stock.reference', reference),
                      const SizedBox(height: 12),
                      field('stock.batchNumber', batch),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        onPressed: () async {
                          final d = await showDatePicker(
                            context: context,
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                            initialDate: DateTime.now(),
                          );
                          if (d != null) setState(() => expiry = d);
                        },
                        child: Text(
                          expiry?.toIso8601String().substring(0, 10) ??
                              t('stock.expiryDate'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      field('stock.note', note),
                    ],
                    if (error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text(
                          error!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(t('stock.cancel')),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(onPressed: save, child: Text(t('stock.submit'))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditDialog extends ConsumerStatefulWidget {
  final Product product;
  const _EditDialog({required this.product});
  @override
  ConsumerState<_EditDialog> createState() => _EditDialogState();
}

class _EditDialogState extends ConsumerState<_EditDialog> {
  late final name = TextEditingController(text: widget.product.name),
      sku = TextEditingController(text: widget.product.sku),
      price = TextEditingController(text: widget.product.sellingPrice),
      quantity = TextEditingController(
        text: ref.read(inventoryProvider).onHand(widget.product.id),
      ),
      remark = TextEditingController();
  String? error;
  @override
  void dispose() {
    for (final c in [name, sku, price, quantity, remark]) {
      c.dispose();
    }
    super.dispose();
  }

  void save() {
    final t = ref.read(preferencesProvider).t;
    try {
      final s = ref.read(inventoryProvider);
      final diff =
          decimal(quantity.text) - decimal(s.onHand(widget.product.id));
      final priceChanged =
          decimal(price.text) != decimal(widget.product.sellingPrice);
      if (name.text.trim().isEmpty ||
          decimal(quantity.text) < Decimal.zero ||
          decimal(price.text) < Decimal.zero) {
        throw FormatException();
      }
      if ((diff != Decimal.zero || priceChanged) &&
          remark.text.trim().isEmpty) {
        setState(() => error = t('stock.remarkRequired'));
        return;
      }
      final updated = widget.product.copyWith(
        name: name.text.trim(),
        sku: resolveSku(
          sku.text,
          s.products.where((p) => p.id != widget.product.id).map((p) => p.sku),
        ),
        sellingPrice: exact(decimal(price.text)),
      );
      final movement = (diff != Decimal.zero || priceChanged)
          ? Movement(
              id: _uuid.v4(),
              productId: updated.id,
              productName: updated.name,
              productSku: updated.sku,
              baseUnitId: updated.baseUnitId,
              type: 'adjustment',
              baseQuantity: exact(diff),
              enteredQuantity: exact(diff),
              enteredUnitId: updated.baseUnitId,
              conversionToBase: '1',
              occurredAt: DateTime.now().toUtc().toIso8601String(),
              previousSellingPrice: widget.product.sellingPrice,
              sellingPrice: updated.sellingPrice,
              correctionReason: remark.text.trim(),
              note: remark.text.trim(),
              commandId: _uuid.v4(),
            )
          : null;
      ref
          .read(inventoryProvider.notifier)
          .update(updated, adjustment: movement);
      Navigator.pop(context);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(t('inventory.updated'))));
    } catch (e) {
      setState(
        () => error = t(
          e.toString().contains('SKU_TAKEN')
              ? 'stock.skuTaken'
              : 'stock.invalid',
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = ref.watch(preferencesProvider).t;
    return AlertDialog(
      title: Text(t('inventory.editTitle')),
      content: SizedBox(
        width: 430,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                decoration: InputDecoration(labelText: t('stock.productName')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: sku,
                decoration: InputDecoration(labelText: t('stock.sku')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: quantity,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: t('stock.targetQuantity'),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: price,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: t('stock.sellingPrice')),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: remark,
                decoration: InputDecoration(labelText: t('stock.remark')),
              ),
              if (error != null)
                Text(
                  error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(t('stock.cancel')),
        ),
        FilledButton(onPressed: save, child: Text(t('inventory.save'))),
      ],
    );
  }
}

class _HistoryDialog extends ConsumerStatefulWidget {
  final List<Product> products;
  const _HistoryDialog({required this.products});
  @override
  ConsumerState<_HistoryDialog> createState() => _HistoryDialogState();
}

class _HistoryDialogState extends ConsumerState<_HistoryDialog> {
  @override
  Widget build(BuildContext context) {
    final snapshot = ref.watch(inventoryProvider);
    final t = ref.watch(preferencesProvider).t;
    final ids = widget.products.map((p) => p.id).toSet();
    final movements = snapshot.movements
        .where((m) => ids.contains(m.productId))
        .toList();
    final balances = <String, Decimal>{};
    final entries = <(Movement, String)>[];
    for (final m in movements.reversed) {
      final balance =
          (balances[m.productId] ?? Decimal.zero) + m.signedQuantity;
      balances[m.productId] = balance;
      entries.add((m, exact(balance)));
    }
    return Dialog(
      child: SizedBox(
        width: 650,
        height: MediaQuery.sizeOf(context).height * .75,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      t('stock.history'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Expanded(
              child: entries.isEmpty
                  ? Center(child: Text(t('stock.historyEmpty')))
                  : ListView(
                      children: [
                        for (final entry in entries.reversed)
                          ListTile(
                            title: Text(entry.$1.productName),
                            subtitle: Text(
                              '${t('movement.${entry.$1.type}')} · ${entry.$1.occurredAt.substring(0, 10)} · ${entry.$1.enteredQuantity} ${unitSymbols[entry.$1.enteredUnitId] ?? entry.$1.enteredUnitId} · ${t('stock.conversion')}: ${entry.$1.conversionToBase}${entry.$1.locationName == null ? '' : ' · ${entry.$1.locationName}'}${entry.$1.supplierName == null ? '' : ' · ${entry.$1.supplierName}'}',
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${entry.$1.signedQuantity}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Text('${t('stock.balance')}: ${entry.$2}'),
                                if (entry.$1.type == 'purchase' &&
                                    !movements.any(
                                      (m) => m.reversalOfId == entry.$1.id,
                                    ))
                                  SizedBox(
                                    height: 25,
                                    child: TextButton(
                                      onPressed: () => _reverse(entry.$1),
                                      child: Text(t('stock.reverse')),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _reverse(Movement m) {
    final t = ref.read(preferencesProvider).t;
    final reason = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t('stock.reverseTitle')),
        content: TextField(
          controller: reason,
          decoration: InputDecoration(labelText: t('stock.correctionReason')),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(t('stock.cancel')),
          ),
          FilledButton(
            onPressed: () {
              if (reason.text.trim().isEmpty) return;
              ref.read(inventoryProvider.notifier).reverse(m, reason.text);
              Navigator.pop(ctx);
            },
            child: Text(t('stock.confirmCorrection')),
          ),
        ],
      ),
    );
  }
}
