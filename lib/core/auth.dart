import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

class User {
  final String id, username, displayName, role;
  const User(this.id, this.username, this.displayName, this.role);
}

abstract class AuthRepository {
  User? get currentUser;
  User register(String username, String displayName, String password);
  User login(String username, String password);
  void logout();
}

class MemoryAuthRepository implements AuthRepository {
  final _users = <String, (User, String)>{};
  User? _current;
  @override
  User? get currentUser => _current;
  @override
  User register(String username, String displayName, String password) {
    final key = username.trim().toLowerCase();
    if (_users.containsKey(key)) throw StateError('USERNAME_TAKEN');
    final user = User(const Uuid().v4(), key, displayName.trim(), 'owner');
    _users[key] = (user, password);
    return _current = user;
  }

  @override
  User login(String username, String password) {
    final entry = _users[username.trim().toLowerCase()];
    if (entry == null || entry.$2 != password) {
      throw StateError('INVALID_CREDENTIALS');
    }
    return _current = entry.$1;
  }

  @override
  void logout() => _current = null;
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => MemoryAuthRepository(),
);
final authProvider = NotifierProvider<AuthController, User?>(
  AuthController.new,
);

class AuthController extends Notifier<User?> {
  @override
  User? build() => ref.read(authRepositoryProvider).currentUser;
  void register(String username, String name, String password) => state = ref
      .read(authRepositoryProvider)
      .register(username, name, password);
  void login(String username, String password) =>
      state = ref.read(authRepositoryProvider).login(username, password);
  void logout() {
    ref.read(authRepositoryProvider).logout();
    state = null;
  }
}
