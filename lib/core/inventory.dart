import 'package:decimal/decimal.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

final _ids = Uuid();
Decimal decimal(String value) =>
    Decimal.parse(value.trim().isEmpty ? '0' : value.trim());
String exact(Decimal value) => value.toString();

class ProductUnit {
  final String id, unitId, baseQuantity;
  final String? unitName;
  final bool canPurchase, canSell;
  const ProductUnit({
    required this.id,
    required this.unitId,
    required this.baseQuantity,
    this.unitName,
    this.canPurchase = true,
    this.canSell = true,
  });
}

class Product {
  final String id, familyId, name, sku, baseUnitId, sellingPrice;
  final String? categoryId, categoryName, variantName, archivedAt;
  final Map<String, String> variantOptions;
  final List<ProductUnit> units;
  const Product({
    required this.id,
    required this.familyId,
    required this.name,
    required this.sku,
    required this.baseUnitId,
    required this.sellingPrice,
    required this.units,
    this.categoryId,
    this.categoryName,
    this.variantName,
    this.archivedAt,
    this.variantOptions = const {},
  });
  Product copyWith({
    String? name,
    String? sku,
    String? sellingPrice,
    String? archivedAt,
    bool restore = false,
  }) => Product(
    id: id,
    familyId: familyId,
    name: name ?? this.name,
    sku: sku ?? this.sku,
    baseUnitId: baseUnitId,
    sellingPrice: sellingPrice ?? this.sellingPrice,
    units: units,
    categoryId: categoryId,
    categoryName: categoryName,
    variantName: variantName,
    variantOptions: variantOptions,
    archivedAt: restore ? null : archivedAt ?? this.archivedAt,
  );
}

class Movement {
  final String id,
      productId,
      productName,
      productSku,
      baseUnitId,
      type,
      baseQuantity,
      enteredQuantity,
      enteredUnitId,
      conversionToBase,
      occurredAt;
  final String? variantName,
      categoryName,
      locationName,
      supplierName,
      unitCost,
      sellingPrice,
      previousSellingPrice,
      reference,
      batchNumber,
      expiryDate,
      actorName,
      commandId,
      note,
      reversalOfId,
      correctionReason;
  const Movement({
    required this.id,
    required this.productId,
    required this.productName,
    required this.productSku,
    required this.baseUnitId,
    required this.type,
    required this.baseQuantity,
    required this.enteredQuantity,
    required this.enteredUnitId,
    required this.conversionToBase,
    required this.occurredAt,
    this.variantName,
    this.categoryName,
    this.locationName,
    this.supplierName,
    this.unitCost,
    this.sellingPrice,
    this.previousSellingPrice,
    this.reference,
    this.batchNumber,
    this.expiryDate,
    this.actorName,
    this.commandId,
    this.note,
    this.reversalOfId,
    this.correctionReason,
  });
  Decimal get signedQuantity =>
      {
        'sale',
        'supplier_return',
        'damage',
        'consumption',
        'transfer_out',
      }.contains(type)
      ? -decimal(baseQuantity)
      : decimal(baseQuantity);
}

class InventorySnapshot {
  final List<Product> products;
  final List<Movement> movements;
  final List<String> categories, suppliers, locations;
  const InventorySnapshot({
    this.products = const [],
    this.movements = const [],
    this.categories = const [],
    this.suppliers = const [],
    this.locations = const [],
  });
  InventorySnapshot copyWith({
    List<Product>? products,
    List<Movement>? movements,
    List<String>? categories,
    List<String>? suppliers,
    List<String>? locations,
  }) => InventorySnapshot(
    products: products ?? this.products,
    movements: movements ?? this.movements,
    categories: categories ?? this.categories,
    suppliers: suppliers ?? this.suppliers,
    locations: locations ?? this.locations,
  );
  String onHand(String productId) => exact(
    movements
        .where((m) => m.productId == productId)
        .fold<Decimal>(Decimal.zero, (sum, m) => sum + m.signedQuantity),
  );
  String? averageCost(String productId) {
    Decimal quantity = Decimal.zero, value = Decimal.zero;
    for (final m in movements.where((m) => m.productId == productId)) {
      if (m.type == 'purchase' && m.unitCost != null) {
        quantity += decimal(m.baseQuantity);
        value += decimal(m.enteredQuantity) * decimal(m.unitCost!);
      }
      if (m.type == 'adjustment' && m.reversalOfId != null) {
        final original = movements
            .where((item) => item.id == m.reversalOfId)
            .firstOrNull;
        if (original?.type == 'purchase' && original?.unitCost != null) {
          quantity += decimal(m.baseQuantity);
          value -=
              decimal(original!.enteredQuantity) * decimal(original.unitCost!);
        }
      }
    }
    return quantity > Decimal.zero
        ? (value / quantity).toDecimal(scaleOnInfinitePrecision: 6).toString()
        : null;
  }
}

abstract class InventoryRepository {
  InventorySnapshot get snapshot;
  void addReceipt({
    required Product product,
    required ProductUnit unit,
    required String quantity,
    required String unitCost,
    String? location,
    String? supplier,
    String? reference,
    String? batch,
    String? expiry,
    String? note,
    String? actor,
    String? commandId,
    bool addProduct = false,
  });
  void updateProduct(Product product, {Movement? adjustment});
  void deleteProduct(String id);
  void reverseReceipt(Movement movement, String reason);
  void addCategory(String name);
  void addSupplier(String name);
  void addLocation(String name);
}

class MemoryInventoryRepository implements InventoryRepository {
  InventorySnapshot _snapshot = const InventorySnapshot();
  @override
  InventorySnapshot get snapshot => _snapshot;
  @override
  void addReceipt({
    required Product product,
    required ProductUnit unit,
    required String quantity,
    required String unitCost,
    String? location,
    String? supplier,
    String? reference,
    String? batch,
    String? expiry,
    String? note,
    String? actor,
    String? commandId,
    bool addProduct = false,
  }) {
    if (decimal(quantity) <= Decimal.zero ||
        decimal(unit.baseQuantity) <= Decimal.zero ||
        decimal(unitCost) < Decimal.zero ||
        !unit.canPurchase) {
      throw FormatException('INVALID');
    }
    if (commandId != null &&
        _snapshot.movements.any((m) => m.commandId == commandId)) {
      return;
    }
    final movement = Movement(
      id: _ids.v4(),
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      baseUnitId: product.baseUnitId,
      type: 'purchase',
      baseQuantity: exact(decimal(quantity) * decimal(unit.baseQuantity)),
      enteredQuantity: exact(decimal(quantity)),
      enteredUnitId: unit.unitId,
      conversionToBase: exact(decimal(unit.baseQuantity)),
      occurredAt: DateTime.now().toUtc().toIso8601String(),
      variantName: product.variantName,
      categoryName: product.categoryName,
      locationName: location,
      supplierName: supplier,
      unitCost: exact(decimal(unitCost)),
      sellingPrice: product.sellingPrice,
      reference: reference,
      batchNumber: batch,
      expiryDate: expiry,
      note: note,
      actorName: actor,
      commandId: commandId,
    );
    _snapshot = _snapshot.copyWith(
      products: addProduct ? [..._snapshot.products, product] : null,
      movements: [movement, ..._snapshot.movements],
    );
  }

  @override
  void updateProduct(Product product, {Movement? adjustment}) =>
      _snapshot = _snapshot.copyWith(
        products: [
          for (final p in _snapshot.products)
            if (p.id == product.id) product else p,
        ],
        movements: adjustment == null
            ? null
            : [adjustment, ..._snapshot.movements],
      );
  @override
  void deleteProduct(String id) {
    if (_snapshot.movements.any((m) => m.productId == id)) {
      throw StateError('PRODUCT_HAS_HISTORY');
    }
    _snapshot = _snapshot.copyWith(
      products: _snapshot.products.where((p) => p.id != id).toList(),
    );
  }

  @override
  void reverseReceipt(Movement movement, String reason) {
    if (reason.trim().isEmpty ||
        _snapshot.movements.any((m) => m.reversalOfId == movement.id)) {
      throw FormatException('CORRECTION_REASON_REQUIRED');
    }
    _snapshot = _snapshot.copyWith(
      movements: [
        Movement(
          id: _ids.v4(),
          productId: movement.productId,
          productName: movement.productName,
          productSku: movement.productSku,
          baseUnitId: movement.baseUnitId,
          type: 'adjustment',
          baseQuantity: exact(-movement.signedQuantity),
          enteredQuantity: exact(-decimal(movement.enteredQuantity)),
          enteredUnitId: movement.enteredUnitId,
          conversionToBase: movement.conversionToBase,
          occurredAt: DateTime.now().toUtc().toIso8601String(),
          reversalOfId: movement.id,
          correctionReason: reason.trim(),
          unitCost: movement.unitCost,
        ),
        ..._snapshot.movements,
      ],
    );
  }

  @override
  void addCategory(String name) => _snapshot = _snapshot.copyWith(
    categories: {..._snapshot.categories, name.trim()}.toList(),
  );
  @override
  void addSupplier(String name) => _snapshot = _snapshot.copyWith(
    suppliers: {..._snapshot.suppliers, name.trim()}.toList(),
  );
  @override
  void addLocation(String name) => _snapshot = _snapshot.copyWith(
    locations: {..._snapshot.locations, name.trim()}.toList(),
  );
}

final inventoryRepositoryProvider = Provider<InventoryRepository>(
  (ref) => MemoryInventoryRepository(),
);
final inventoryProvider =
    NotifierProvider<InventoryController, InventorySnapshot>(
      InventoryController.new,
    );

class InventoryController extends Notifier<InventorySnapshot> {
  @override
  InventorySnapshot build() => ref.read(inventoryRepositoryProvider).snapshot;
  void refresh() => state = ref.read(inventoryRepositoryProvider).snapshot;
  void addReceipt({
    required Product product,
    required ProductUnit unit,
    required String quantity,
    required String unitCost,
    String? location,
    String? supplier,
    String? reference,
    String? batch,
    String? expiry,
    String? note,
    String? actor,
    String? commandId,
    bool addProduct = false,
  }) {
    ref
        .read(inventoryRepositoryProvider)
        .addReceipt(
          product: product,
          unit: unit,
          quantity: quantity,
          unitCost: unitCost,
          location: location,
          supplier: supplier,
          reference: reference,
          batch: batch,
          expiry: expiry,
          note: note,
          actor: actor,
          commandId: commandId,
          addProduct: addProduct,
        );
    refresh();
  }

  void update(Product p, {Movement? adjustment}) {
    ref
        .read(inventoryRepositoryProvider)
        .updateProduct(p, adjustment: adjustment);
    refresh();
  }

  void delete(String id) {
    ref.read(inventoryRepositoryProvider).deleteProduct(id);
    refresh();
  }

  void reverse(Movement m, String reason) {
    ref.read(inventoryRepositoryProvider).reverseReceipt(m, reason);
    refresh();
  }

  void addCategory(String name) {
    ref.read(inventoryRepositoryProvider).addCategory(name);
    refresh();
  }

  void addSupplier(String name) {
    ref.read(inventoryRepositoryProvider).addSupplier(name);
    refresh();
  }

  void addLocation(String name) {
    ref.read(inventoryRepositoryProvider).addLocation(name);
    refresh();
  }
}

const unitIds = [
  'piece',
  'milligram',
  'gram',
  'kilogram',
  'tical',
  'viss',
  'milliliter',
  'liter',
  'pyi',
  'basket',
  'millimeter',
  'centimeter',
  'meter',
  'ounce',
  'pound',
  'inch',
  'foot',
  'gallon',
  'bag',
  'bottle',
  'pack',
  'case',
  'custom',
];
const unitSymbols = <String, String>{
  'piece': 'pc',
  'milligram': 'mg',
  'gram': 'g',
  'kilogram': 'kg',
  'tical': 'tical',
  'viss': 'viss',
  'milliliter': 'ml',
  'liter': 'L',
  'pyi': 'pyi',
  'basket': 'basket',
  'millimeter': 'mm',
  'centimeter': 'cm',
  'meter': 'm',
  'ounce': 'oz',
  'pound': 'lb',
  'inch': 'in',
  'foot': 'ft',
  'gallon': 'gal',
  'bag': 'bag',
  'bottle': 'btl',
  'pack': 'pack',
  'case': 'case',
};
String resolveSku(String requested, Iterable<String> used) {
  final normalized = requested.trim().toUpperCase();
  final values = used.map((sku) => sku.toUpperCase()).toSet();
  if (normalized.isNotEmpty) {
    if (values.contains(normalized)) throw StateError('SKU_TAKEN');
    return normalized;
  }
  var sequence = 1;
  while (values.contains('SP-${sequence.toString().padLeft(6, '0')}')) {
    sequence++;
  }
  return 'SP-${sequence.toString().padLeft(6, '0')}';
}
