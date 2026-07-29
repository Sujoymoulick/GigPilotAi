import test from 'node:test';
import assert from 'node:assert';
import app from '../src/index.ts';

test('Hono API Worker - Social Hub Integration Tests', async (t) => {
  let mockToken = '';

  // Get auth token first
  await t.test('Auth Setup - Login for valid session token', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@gigpilot.ai', password: 'password123' })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.ok(body.data.token);
    mockToken = body.data.token;
  });

  await t.test('GET /api/social/accounts - should retrieve seeded accounts list', async () => {
    const res = await app.request('/api/social/accounts', {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  await t.test('POST /api/social/connect - should successfully connect a mock account', async () => {
    const res = await app.request('/api/social/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        provider: 'bluesky',
        code: 'mock_bluesky_code',
        redirectUri: 'http://localhost:3000/social/callback'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.provider, 'bluesky');
    assert.strictEqual(body.data.username, 'gigpilot.bsky.social');
  });

  await t.test('GET /api/social/posts - should retrieve list of posts', async () => {
    const res = await app.request('/api/social/posts', {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  await t.test('POST /api/social/posts - should create a new post draft', async () => {
    const res = await app.request('/api/social/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        title: 'Test Post Draft',
        content: 'This is a test post content',
        status: 'Draft'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.title, 'Test Post Draft');
    assert.strictEqual(body.data.status, 'Draft');
  });

  await t.test('POST /api/social/publish - should immediately publish post to mock channels', async () => {
    // Connect LinkedIn first
    const connRes = await app.request('/api/social/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        provider: 'linkedin',
        code: 'mock'
      })
    });
    const connData = await connRes.json();
    const accountId = connData.data.id;

    const res = await app.request('/api/social/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        title: 'Instant Publish Test',
        content: 'Publishing immediately to LinkedIn!',
        accountIds: [accountId]
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data[0].success);
    assert.ok(body.data[0].url);
  });

  await t.test('POST /api/social/schedule - should schedule a post', async () => {
    const connRes = await app.request('/api/social/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        provider: 'mastodon',
        code: 'mock'
      })
    });
    const connData = await connRes.json();
    const accountId = connData.data.id;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await app.request('/api/social/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        title: 'Scheduled Test Post',
        content: 'This post is scheduled for tomorrow',
        scheduledTime: tomorrow.toISOString(),
        accountIds: [accountId]
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.post.status, 'Scheduled');
    assert.ok(body.data.scheduledRecords.length > 0);
  });

  await t.test('POST /api/social/scheduler/run - should process eligible queue items', async () => {
    // Schedule a post in the past (eligible for immediate run)
    const connRes = await app.request('/api/social/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        provider: 'linkedin',
        code: 'mock'
      })
    });
    const connData = await connRes.json();
    const accountId = connData.data.id;

    const past = new Date(Date.now() - 5000); // 5 seconds ago
    const schedRes = await app.request('/api/social/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        title: 'Past Scheduled Post',
        content: 'Should trigger right now!',
        scheduledTime: past.toISOString(),
        accountIds: [accountId]
      })
    });
    
    // Trigger run
    const runRes = await app.request('/api/social/scheduler/run', {
      method: 'POST'
    });
    assert.strictEqual(runRes.status, 200);
    const runData = await runRes.json();
    assert.strictEqual(runData.success, true);
    assert.ok(runData.processedCount > 0);
  });

  await t.test('GET /api/social/analytics - should return analytics log list', async () => {
    const res = await app.request('/api/social/analytics', {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  await t.test('Media Library CRUD operations', async () => {
    // 1. Create media
    const createRes = await app.request('/api/social/media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        filename: 'test_file.png',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        size: 50000
      })
    });
    assert.strictEqual(createRes.status, 200);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.success, true);
    const mediaId = createBody.data.id;

    // 2. Get media list
    const listRes = await app.request('/api/social/media', {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    const listBody = await listRes.json();
    assert.ok(listBody.data.find((m) => m.id === mediaId));

    // 3. Delete media
    const deleteRes = await app.request(`/api/social/media/${mediaId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.strictEqual(deleteBody.success, true);
  });

  await t.test('Campaigns CRUD operations', async () => {
    // 1. Create campaign
    const createRes = await app.request('/api/social/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        name: 'Test Campaign Integration',
        description: 'Testing integration campaigns',
        color: '#EF4444',
        budget: 1000,
        goal: 'Testing goal'
      })
    });
    assert.strictEqual(createRes.status, 200);
    const createBody = await createRes.json();
    assert.strictEqual(createBody.success, true);
    const campaignId = createBody.data.id;

    // 2. Get list
    const listRes = await app.request('/api/social/campaigns', {
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    const listBody = await listRes.json();
    assert.ok(listBody.data.find((c) => c.id === campaignId));

    // 3. Delete campaign
    const deleteRes = await app.request(`/api/social/campaigns/${campaignId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${mockToken}` }
    });
    assert.strictEqual(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.strictEqual(deleteBody.success, true);
  });

  await t.test('POST /api/social/ai/generate - should return AI generated draft response', async () => {
    const res = await app.request('/api/social/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify({
        action: 'generate',
        prompt: 'Create a LinkedIn post promoting GigPilot',
        platform: 'linkedin',
        tone: 'Professional'
      })
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.content);
    assert.ok(body.data.hashtags);
  });
});
