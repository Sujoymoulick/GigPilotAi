import test from 'node:test';
import assert from 'node:assert';
import app from '../src/index.ts';

test('Hono API Worker Integration Tests', async (t) => {
  await t.test('GET /api/health should return online status', async () => {
    const res = await app.request('/api/health');
    assert.strictEqual(res.status, 200);
    
    const body = await res.json();
    assert.strictEqual(body.status, 'online');
    assert.ok(body.system);
  });

  let token = '';

  await t.test('POST /api/auth/login should return valid token and user', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@gigpilot.ai', password: 'password123' })
    });
    assert.strictEqual(res.status, 200);
    
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    token = body.data.token;
    assert.strictEqual(body.data.user.email, 'test@gigpilot.ai');
    assert.strictEqual(body.data.user.role, 'Pro');
  });

  await t.test('POST /api/gig/generate should return structured gig output', async () => {
    const res = await app.request('/api/gig/generate', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        category: 'Tech',
        subcategory: 'Web Development',
        service: 'Next.js developer',
        experience: 'Expert',
        targetAudience: 'Startups',
        tone: 'Persuasive'
      })
    });
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.content.seoTitle);
    assert.ok(body.data.content.description);
    assert.ok(body.data.content.packages);
    assert.ok(body.data.content.tags);
  });
});
