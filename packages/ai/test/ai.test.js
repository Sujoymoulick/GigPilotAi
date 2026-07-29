import test from 'node:test';
import assert from 'node:assert';
import { aiManager } from '../src/index.ts';
import { buildGigPrompt } from '../src/prompts/gig';

test('AI Abstraction Service Manager', async (t) => {
  await t.test('should resolve default provider (OpenAI)', () => {
    const provider = aiManager.getProvider();
    assert.strictEqual(provider.providerName, 'OpenAI');
  });

  await t.test('should resolve specific provider correctly', () => {
    const provider = aiManager.getProvider('gemini');
    assert.strictEqual(provider.providerName, 'Google Gemini');
  });

  await t.test('should resolve Groq provider correctly', () => {
    const provider = aiManager.getProvider('groq');
    assert.strictEqual(provider.providerName, 'Groq');
  });

  await t.test('should fallback gracefully to OpenAI if provider name is unknown', () => {
    const provider = aiManager.getProvider('some-unknown-provider');
    assert.strictEqual(provider.providerName, 'OpenAI');
  });
});

test('Gig Prompt Compilation', () => {
  const mockInput = {
    category: 'Programming',
    subcategory: 'Web Dev',
    service: 'Next.js App',
    experience: 'Expert',
    targetAudience: 'SaaS Owners',
    tone: 'Persuasive',
    country: 'United States',
    language: 'English',
    competitorUrls: ['https://fiverr.com/competitor'],
    additionalNotes: 'Make it lightning fast'
  };

  const compiledPrompt = buildGigPrompt(mockInput);
  assert.ok(compiledPrompt.includes('Category: Programming'));
  assert.ok(compiledPrompt.includes('Tone: Persuasive'));
  assert.ok(compiledPrompt.includes('Target Country: United States'));
  assert.ok(compiledPrompt.includes('JSON'));
});
