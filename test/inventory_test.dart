import 'package:flutter_test/flutter_test.dart';
import 'package:sale_pilot/core/inventory.dart';

void main() {
  test('receipts store exact base quantity and audit conversion', () {
    final repo = MemoryInventoryRepository();
    const unit = ProductUnit(id: 'box', unitId: 'box', baseQuantity: '12.5');
    const product = Product(
      id: 'p',
      familyId: 'p',
      name: 'Rice',
      sku: 'R',
      baseUnitId: 'kilogram',
      sellingPrice: '4.25',
      units: [unit],
    );
    repo.addReceipt(
      product: product,
      unit: unit,
      quantity: '2.4',
      unitCost: '3.10',
      addProduct: true,
    );
    expect(repo.snapshot.onHand('p'), '30');
    final receipt = repo.snapshot.movements.single;
    expect(receipt.enteredQuantity, '2.4');
    expect(receipt.conversionToBase, '12.5');
    repo.reverseReceipt(receipt, 'Correction');
    expect(repo.snapshot.onHand('p'), '0');
    expect(repo.snapshot.movements.length, 2);
  });
  test('SKUs match the original uniqueness rules', () {
    expect(resolveSku(' ab-1 ', []), 'AB-1');
    expect(resolveSku('', []), 'SP-000001');
    expect(resolveSku('', ['SP-000001']), 'SP-000002');
    expect(() => resolveSku('ab-1', ['AB-1']), throwsStateError);
  });

  test('product deletion keeps movement history', () {
    final repo = MemoryInventoryRepository();
    const unit = ProductUnit(id: 'p-base', unitId: 'piece', baseQuantity: '1');
    const product = Product(
      id: 'p',
      familyId: 'p',
      name: 'Item',
      sku: 'I',
      baseUnitId: 'piece',
      sellingPrice: '1',
      units: [unit],
    );
    repo.addReceipt(
      product: product,
      unit: unit,
      quantity: '1',
      unitCost: '1',
      addProduct: true,
    );
    expect(() => repo.deleteProduct('p'), throwsStateError);
  });
}
