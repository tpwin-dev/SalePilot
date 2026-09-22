import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sale_pilot/main.dart';

void main() {
  testWidgets('shows login', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: SalePilotApp()));
    await tester.pumpAndSettle();
    expect(find.text('Log in'), findsWidgets);
  });
}
