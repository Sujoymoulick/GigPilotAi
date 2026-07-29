import test from 'node:test';
import assert from 'node:assert';
import { authService } from '../src/index.ts';

test('AuthService Token Operations', async (t) => {
  const mockUser = {
    id: 'usr_test_123',
    email: 'test@gigpilot.ai',
    fullName: 'Test User',
    role: 'Pro',
    creditsRemaining: 100,
    monthlyQuota: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await t.test('should generate a base64url token', () => {
    const token = authService.createToken(mockUser);
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');
    assert.ok(token.length > 10);
  });

  await t.test('should verify a valid token and return payload', async () => {
    const token = authService.createToken(mockUser);
    const payload = await authService.verifyToken(token);
    assert.ok(payload);
    assert.strictEqual(payload.userId, 'usr_test_123');
    assert.strictEqual(payload.email, 'test@gigpilot.ai');
    assert.strictEqual(payload.role, 'Pro');
  });

  await t.test('should fail verification for expired or modified tokens', async () => {
    const invalidToken = 'this-is-not-a-valid-jwt-token';
    const payload = await authService.verifyToken(invalidToken);
    assert.strictEqual(payload, null);
  });
});

test('AuthService Role Permissions', () => {
  assert.strictEqual(authService.hasPermission('Admin', 'Free'), true);
  assert.strictEqual(authService.hasPermission('Pro', 'Agency'), false);
  assert.strictEqual(authService.hasPermission('Agency', 'Pro'), true);
  assert.strictEqual(authService.hasPermission('Free', 'Free'), true);
});
