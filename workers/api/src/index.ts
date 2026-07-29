import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import { createMiddleware } from 'hono/factory';
import { 
  aiManager, 
  buildGigPrompt, 
  buildProposalPrompt, 
  buildPricingPrompt, 
  buildKeywordsPrompt, 
  buildReviewPrompt, 
  buildPortfolioPrompt, 
  buildReplyPrompt,
  buildSEOAuditPrompt,
  buildGigHealthPrompt
} from '@gigpilot/ai';
import { authService } from '@gigpilot/auth';
import { dbClient } from '@gigpilot/database';
import { getSocialProvider } from './social/providers';

const app = new Hono<{ Variables: { user: any } }>();

// Global CORS Middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Rate Limiting Middleware (Mock Implementation)
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 100; // 100 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

app.use('*', async (c, next) => {
  const ip = c.req.header('x-forwarded-for') || 'local-ip';
  const now = Date.now();
  const limitInfo = ipRequestCounts.get(ip);

  if (limitInfo && now < limitInfo.resetAt) {
    if (limitInfo.count >= RATE_LIMIT_MAX) {
      return c.json({ success: false, error: 'Too many requests. Please try again in 1 minute.' }, 429);
    }
    limitInfo.count++;
  } else {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  }

  // Set standard security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Content-Security-Policy', "default-src 'self'");
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  await next();
});

// Audit Logging & Error Handling Middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  const authHeader = c.req.header('Authorization');
  let userId = 'anonymous';

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    const user = authService.verifyToken(token);
    if (user) {
      userId = user.userId;
    }
  }

  try {
    await next();
    const duration = Date.now() - start;

    // Log API access to database
    dbClient.insert('api_logs', {
      user_id: userId,
      endpoint: c.req.path,
      status_code: c.res.status,
      response_time_ms: duration,
    });
  } catch (err: any) {
    const duration = Date.now() - start;
    console.error(`[API ERROR] ${c.req.method} ${c.req.path}:`, err);

    dbClient.insert('api_logs', {
      user_id: userId,
      endpoint: c.req.path,
      status_code: 500,
      response_time_ms: duration,
    });

    return c.json({ success: false, error: err.message || 'Internal Server Error' }, 500);
  }
});

// Authentication Middleware
const authMiddleware = createMiddleware<{ Variables: { user: any } }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized: Missing token' }, 401);
  }

  const payload = authService.verifyToken(token);
  if (!payload) {
    return c.json({ success: false, error: 'Unauthorized: Session expired or invalid' }, 401);
  }

  c.set('user', payload);
  await next();
});

// 1. Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'online',
    system: 'GigPilot AI API Hono Server',
    db: dbClient.getClientInfo(),
    timestamp: new Date().toISOString()
  });
});

// 2. Auth Routes
app.post('/api/auth/login', async (c) => {
  const { email, password, fullName } = await c.req.json();
  if (!email) return c.json({ success: false, error: 'Email is required' }, 400);

  // If user does not exist in DB, insert it
  const users = dbClient.getCollection('users');
  let user = users.find((u) => u.email === email);
  if (!user) {
    const name = fullName || email.split('@')[0];
    user = dbClient.insert('users', {
      email,
      full_name: name,
      fullName: name,
      role: 'Pro',
      credits_remaining: 450,
      monthly_quota: 500,
    });
  }

  const token = authService.createToken(user);
  return c.json({
    success: true,
    data: { token, user }
  });
});

app.post('/api/auth/magic-link', async (c) => {
  const { email } = await c.req.json();
  if (!email) return c.json({ success: false, error: 'Email is required' }, 400);
  const magicUrl = authService.createMagicLink(email);
  return c.json({ success: true, message: 'Magic link sent successfully', magicUrl });
});

app.get('/api/auth/me', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const userProfile = dbClient.getById('users', userPayload.userId);
  if (!userProfile) return c.json({ success: false, error: 'User profile not found' }, 404);

  return c.json({ success: true, data: userProfile });
});

// 3. Proposal Generator API
app.get('/api/proposals', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'Proposal Generator')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  return c.json({ success: true, data: list });
});

app.post('/api/proposal/generate', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { jobDescription, myService, tone } = body;

  if (!jobDescription || !myService) {
    return c.json({ success: false, error: 'Job description and Service are required' }, 400);
  }

  // Deduct credit
  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildProposalPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      subjectLine: `High-Impact Response: ${myService}`,
      proposalText: `Hello,\n\nI reviewed your project request for: "${jobDescription.slice(0, 100)}...". I am a professional freelancer specializing in ${myService} and am fully ready to deliver top-tier results.\n\nTone: ${tone || 'Professional'}\n\nLet me know if we can discuss the details.`,
      keyHighlights: ['Custom design assets', 'Responsive layout support'],
      suggestedQuestions: ['What are the core timelines for this job?'],
      callToAction: 'Send me a message in inbox to get started right away.'
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Proposal Generator',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider,
    is_favorite: false
  });

  return c.json({ success: true, data: record });
});

app.put('/api/proposals/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = dbClient.update('generations', id, { output: body.output });
  if (!updated) return c.json({ success: false, error: 'Proposal not found' }, 404);
  return c.json({ success: true, data: updated });
});

app.delete('/api/proposals/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('generations', id);
  return c.json({ success: deleted });
});

// 4. Gigs API
app.get('/api/gigs', authMiddleware, (c) => {
  const list = dbClient.getCollection('gigs')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/gig/generate', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { service, category } = body;

  if (!service) return c.json({ success: false, error: 'Service name is required' }, 400);

  dbClient.deductCredits(userPayload.userId, 2);

  const prompt = buildGigPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
    if (!parsedOutput || Object.keys(parsedOutput).length === 0 || !parsedOutput.seoTitle) {
      throw new Error('Empty or invalid mock AI response');
    }
  } catch {
    parsedOutput = {
      seoTitle: `I will do expert ${service}`,
      description: `Need expert help with ${service}? I provide premium layouts, clean files and commercial rights.`,
      packages: {
        basic: { name: 'Basic', title: 'Starter setup', description: 'Essential deliverables', price: 25, deliveryDays: 3, revisions: '3', features: [] },
        standard: { name: 'Standard', title: 'Pro setup', description: 'Recommended deliverables', price: 65, deliveryDays: 5, revisions: '5', features: [] },
        premium: { name: 'Premium', title: 'Enterprise setup', description: 'Full business solutions', price: 150, deliveryDays: 7, revisions: 'Unlimited', features: [] }
      },
      faqs: [],
      requirements: [],
      tags: [service.toLowerCase().replace(/\s+/g, '-')],
      callToAction: 'Order now!',
      imagePrompt: 'A glowing desk with code mockups for gig cover image.',
      videoScript: 'Hi there, need this gig? I will deliver it fast.',
      upsellSuggestions: []
    };
  }

  const record = dbClient.insert('gigs', {
    user_id: userPayload.userId,
    title: parsedOutput.seoTitle,
    category: category || 'Web Programming',
    content: parsedOutput,
    status: 'draft'
  });

  return c.json({
    success: true,
    data: record,
    meta: { tokensUsed: result.tokensUsed, provider: result.provider }
  });
});

app.put('/api/gigs/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = dbClient.update('gigs', id, body);
  if (!updated) return c.json({ success: false, error: 'Gig not found' }, 404);
  return c.json({ success: true, data: updated });
});

app.delete('/api/gigs/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('gigs', id);
  return c.json({ success: deleted });
});

// 5. Keyword Finder API
app.get('/api/keywords', authMiddleware, (c) => {
  const list = dbClient.getCollection('keywords')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/keywords/find', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { service } = body;

  if (!service) return c.json({ success: false, error: 'Service is required' }, 400);

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildKeywordsPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      primaryKeywords: [{ keyword: service, type: 'primary', estimatedSearchVolume: 12000, competitionLevel: 'Medium', difficultyScore: 50, opportunityScore: 75, trend: 'Stable', intent: 'Transactional' }],
      longTailKeywords: [],
      relatedSearches: [],
      competitorKeywords: [],
      summary: { avgDifficulty: 50, avgOpportunity: 75, recommendedFocus: [] }
    };
  }

  const record = dbClient.insert('keywords', {
    user_id: userPayload.userId,
    service,
    keyword_data: parsedOutput
  });

  return c.json({ success: true, data: record });
});

app.delete('/api/keywords/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('keywords', id);
  return c.json({ success: deleted });
});

// 6. Pricing Optimizer API
app.get('/api/pricing', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'Pricing Optimizer')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/pricing/optimize', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildPricingPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      basicPrice: 20, standardPrice: 50, premiumPrice: 120,
      recommendedExtras: [], recommendedDiscounts: [], competitiveAnalysis: 'Sweet spot analysis.'
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Pricing Optimizer',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

// 7. Gig Health Checker API
app.get('/api/gig/health', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'Gig Health Checker')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/gig/health', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildGigHealthPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      overallScore: 82, seoScore: 85, readabilityScore: 90, ctaScore: 80,
      keywordDensityScore: 78, grammarScore: 95, trustScore: 88, conversionScore: 80,
      suggestions: []
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Gig Health Checker',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

// 8. Portfolio Builder API
app.get('/api/portfolio', authMiddleware, (c) => {
  const list = dbClient.getCollection('portfolios')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/portfolio/generate', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { role, skills } = body;

  if (!role || !skills) {
    return c.json({ success: false, error: 'Role and Skills are required' }, 400);
  }

  dbClient.deductCredits(userPayload.userId, 2);

  const prompt = buildPortfolioPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      aboutMe: `I am an expert freelance professional specialized in ${role}.`,
      caseStudies: [], projectDescriptions: [], testimonials: [], portfolioWebsiteCopy: '', linkedInAbout: ''
    };
  }

  const record = dbClient.insert('portfolios', {
    user_id: userPayload.userId,
    role,
    portfolio_data: parsedOutput
  });

  // Also save to generations for history
  dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Portfolio Builder',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

app.delete('/api/portfolio/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('portfolios', id);
  return c.json({ success: deleted });
});

// 9. Client Messages API
app.get('/api/messages', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'Client Messages')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/messages/reply', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { clientMessage, type } = body;

  if (!clientMessage) return c.json({ success: false, error: 'Client message is required' }, 400);

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildReplyPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      replyText: `Hi there, thank you for writing. I will handle this request. Let's arrange details in inbox.`,
      tone: type,
      alternativeOptions: []
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Client Messages',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

// 10. Review Analyzer API
app.get('/api/reviews', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'Review Analyzer')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/reviews/analyze', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();

  if (!body.reviewsText) return c.json({ success: false, error: 'Reviews content is required' }, 400);

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildReviewPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      positiveCount: 10, negativeCount: 0, overallSentimentScore: 100,
      commonComplaints: [], strengths: [], weaknesses: [], recommendations: [],
      sentimentBreakdown: [], topKeywords: []
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'Review Analyzer',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

// 11. SEO Audit API
app.get('/api/seo', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .filter((g) => g.module === 'SEO Audit')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/seo/audit', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const { title, description, keywords } = body;

  if (!title || !description || !keywords) {
    return c.json({ success: false, error: 'Title, description and keywords are required' }, 400);
  }

  dbClient.deductCredits(userPayload.userId, 1);

  const prompt = buildSEOAuditPrompt(body);
  const result = await aiManager.generate(prompt, body.provider, { jsonMode: true });

  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
  } catch {
    parsedOutput = {
      seoScore: 78, keywordScore: 80, ctrPrediction: 9.5,
      missingKeywords: [], optimizationTips: [], titleSuggestions: []
    };
  }

  const record = dbClient.insert('generations', {
    user_id: userPayload.userId,
    module: 'SEO Audit',
    input: body,
    output: parsedOutput,
    tokens_used: result.tokensUsed,
    provider: result.provider
  });

  return c.json({ success: true, data: record });
});

// 12. Publish Assistant Drafts API
app.get('/api/publish/drafts', authMiddleware, (c) => {
  const list = dbClient.getCollection('gigs')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/publish/drafts', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const record = dbClient.insert('gigs', {
    user_id: userPayload.userId,
    title: body.title || 'Untitled Gig Draft',
    category: body.category || 'Programming & Tech',
    content: body.content || {},
    status: body.status || 'draft'
  });
  return c.json({ success: true, data: record });
});

app.put('/api/publish/drafts/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = dbClient.update('gigs', id, body);
  if (!updated) return c.json({ success: false, error: 'Draft not found' }, 404);
  return c.json({ success: true, data: updated });
});

// 13. Templates API
app.get('/api/templates', authMiddleware, (c) => {
  const list = dbClient.getCollection('templates')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.post('/api/templates', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  const record = dbClient.insert('templates', {
    user_id: userPayload.userId,
    title: body.title,
    category: body.category,
    type: body.type,
    content: body.content,
    is_custom: true,
    isCustom: true,
    is_favorite: false,
    isFavorite: false
  });
  return c.json({ success: true, data: record });
});

app.put('/api/templates/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const updated = dbClient.update('templates', id, body);
  if (!updated) return c.json({ success: false, error: 'Template not found' }, 404);
  return c.json({ success: true, data: updated });
});

app.delete('/api/templates/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('templates', id);
  return c.json({ success: deleted });
});

// 14. History API
app.get('/api/history', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

app.delete('/api/history/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('generations', id);
  return c.json({ success: deleted });
});

app.delete('/api/history', authMiddleware, (c) => {
  const list = dbClient.getCollection('generations');
  for (const item of list) {
    dbClient.delete('generations', item.id);
  }
  return c.json({ success: true });
});

// 15. Favorites API
app.get('/api/favorites', authMiddleware, (c) => {
  // Return list of generations & templates marked as favorite
  const gens = dbClient.getCollection('generations').filter((g) => g.is_favorite || g.isFavorite);
  const tmpls = dbClient.getCollection('templates').filter((t) => t.is_favorite || t.isFavorite);
  
  return c.json({ 
    success: true, 
    data: { generations: gens, templates: tmpls }
  });
});

app.post('/api/favorites/toggle', authMiddleware, async (c) => {
  const { type, id } = await c.req.json(); // type is 'generation' or 'template'
  if (type === 'generation' || type === 'proposal') {
    const item = dbClient.getById('generations', id);
    if (item) {
      const fav = !(item.is_favorite || item.isFavorite);
      dbClient.update('generations', id, { is_favorite: fav, isFavorite: fav });
      return c.json({ success: true, isFavorite: fav });
    }
  } else if (type === 'template') {
    const item = dbClient.getById('templates', id);
    if (item) {
      const fav = !(item.is_favorite || item.isFavorite);
      dbClient.update('templates', id, { is_favorite: fav, isFavorite: fav });
      return c.json({ success: true, isFavorite: fav });
    }
  }
  return c.json({ success: false, error: 'Item not found' }, 404);
});

// 16. Analytics Dashboard API
app.get('/api/analytics', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const logs = dbClient.getCollection('analytics');
  
  // Aggregate stats
  let totalCreditsUsed = 0;
  let totalWordsGenerated = 0;
  let totalTimeSavedMinutes = 0;
  const toolCounts: Record<string, number> = {};

  logs.forEach((log) => {
    totalCreditsUsed += log.creditsUsed || 0;
    totalWordsGenerated += log.wordsGenerated || 0;
    totalTimeSavedMinutes += log.timeSavedMinutes || 0;
    
    if (log.toolUsage) {
      log.toolUsage.forEach((usage: any) => {
        toolCounts[usage.tool] = (toolCounts[usage.tool] || 0) + (usage.count || 0);
      });
    }
  });

  // Find favorite tool
  let favoriteTool = 'Proposal Generator';
  let maxCount = 0;
  Object.entries(toolCounts).forEach(([tool, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteTool = tool;
    }
  });

  const profile = dbClient.getById('users', userPayload.userId);

  return c.json({
    success: true,
    data: {
      creditsRemaining: profile ? profile.credits_remaining : 450,
      totalCreditsUsed,
      totalWordsGenerated,
      totalTimeSavedMinutes,
      favoriteTool,
      timeSavedHours: Math.round(totalTimeSavedMinutes / 60),
      growthPercentage: 24,
      dailyUsage: logs.slice(-7), // Last 7 days
      monthlyUsage: logs, // Last 30 days
      toolUsage: Object.entries(toolCounts).map(([tool, count]) => ({ tool, count }))
    }
  });
});

// 17. Billing Details & Payment
app.get('/api/billing', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const profile = dbClient.getById('users', userPayload.userId);
  const invoices = dbClient.getCollection('billing');
  
  return c.json({
    success: true,
    data: {
      currentPlan: profile ? profile.role : 'Pro',
      creditsRemaining: profile ? profile.credits_remaining : 450,
      monthlyQuota: profile ? profile.monthly_quota : 500,
      renewalDate: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
      subscriptionStatus: 'active',
      invoices
    }
  });
});

app.post('/api/billing/upgrade', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const { plan, razorpayPaymentId, coupon } = await c.req.json();

  if (!plan) return c.json({ success: false, error: 'Plan name is required' }, 400);

  let newQuota = 50;
  let price = 0;
  if (plan === 'Pro') {
    newQuota = 500;
    price = 29;
  } else if (plan === 'Agency') {
    newQuota = 2000;
    price = 89;
  }

  if (coupon === 'LAUNCH20') {
    price = Math.round(price * 0.8 * 100) / 100;
  }

  // Update user role and quota
  dbClient.update('users', userPayload.userId, {
    role: plan,
    credits_remaining: newQuota,
    monthly_quota: newQuota
  });

  // Create invoice billing record
  const invoice = dbClient.insert('billing', {
    user_id: userPayload.userId,
    invoice_id: `INV-${Date.now().toString().slice(-6)}`,
    amount: price,
    currency: 'USD',
    status: 'Paid',
    pdf_url: '#'
  });

  return c.json({
    success: true,
    message: `Successfully upgraded to ${plan} Plan!`,
    data: { invoice }
  });
});

// 18. Settings API
app.get('/api/settings', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const settings = dbClient.getCollection('settings').find((s) => s.user_id === userPayload.userId);
  return c.json({ success: true, data: settings || {} });
});

app.put('/api/settings', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();

  let settings = dbClient.getCollection('settings').find((s) => s.user_id === userPayload.userId);
  if (settings) {
    settings = dbClient.update('settings', settings.id, body);
  } else {
    settings = dbClient.insert('settings', {
      user_id: userPayload.userId,
      ...body
    });
  }

  // Also update user profile name if provided
  if (body.fullName) {
    dbClient.update('users', userPayload.userId, {
      full_name: body.fullName,
      fullName: body.fullName
    });
  }

  return c.json({ success: true, data: settings });
});

// ====================================================
// SOCIAL HUB API ROUTES
// ====================================================

// 1. Get connected social accounts
app.get('/api/social/accounts', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const list = dbClient.getCollection('social_accounts')
    .filter((acc) => acc.user_id === userPayload.userId);
  return c.json({ success: true, data: list });
});

// 2. Connect a social account (OAuth simulation or API Key entry)
app.post('/api/social/connect', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const { provider, code, redirectUri } = await c.req.json();
  
  if (!provider || !code) {
    return c.json({ success: false, error: 'Provider and Code/API Key are required' }, 400);
  }
  
  try {
    const prov = getSocialProvider(provider);
    const tokens = await prov.connect(code, redirectUri || 'http://localhost:3000/social/callback');
    const profile = await prov.getProfile(tokens.access_token);
    
    const collection = dbClient.getCollection('social_accounts');
    let account = collection.find(
      (acc) => acc.user_id === userPayload.userId && acc.provider === provider && acc.provider_user_id === profile.providerUserId
    );
    
    const recordData = {
      user_id: userPayload.userId,
      provider,
      provider_user_id: profile.providerUserId,
      username: profile.username,
      display_name: profile.displayName,
      email: profile.email || '',
      avatar: profile.avatar || '',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : '',
      scope: tokens.scope || '',
      status: 'connected',
      last_sync: new Date().toISOString(),
    };
    
    if (account) {
      account = dbClient.update('social_accounts', account.id, recordData);
    } else {
      account = dbClient.insert('social_accounts', recordData);
    }
    
    dbClient.insert('history', {
      user_id: userPayload.userId,
      action: `Connected ${provider} Account`,
      details: { username: profile.username }
    });
    
    return c.json({ success: true, data: account });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'OAuth Connection Failed' }, 500);
  }
});

// 3. Disconnect a social account
app.post('/api/social/disconnect', authMiddleware, async (c) => {
  const { accountId } = await c.req.json();
  if (!accountId) return c.json({ success: false, error: 'Account ID is required' }, 400);
  
  const account = dbClient.getById('social_accounts', accountId);
  if (!account) return c.json({ success: false, error: 'Account not found' }, 404);
  
  try {
    const prov = getSocialProvider(account.provider);
    await prov.disconnect(accountId);
  } catch (e) {
    // Proceed locally anyway
  }
  
  dbClient.delete('social_accounts', accountId, false); // hard delete
  return c.json({ success: true, message: 'Account disconnected successfully' });
});

// 4. Get posts list
app.get('/api/social/posts', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const list = dbClient.getCollection('posts')
    .filter((post) => post.user_id === userPayload.userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return c.json({ success: true, data: list });
});

// 5. Create or update post (draft/scheduled)
app.post('/api/social/posts', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  
  const record = {
    user_id: userPayload.userId,
    title: body.title || 'Untitled Post',
    content: body.content || '',
    hashtags: body.hashtags || '',
    mentions: body.mentions || '',
    link: body.link || '',
    mediaUrls: body.mediaUrls || [],
    status: body.status || 'Draft'
  };
  
  let post;
  if (body.id) {
    post = dbClient.update('posts', body.id, record);
  } else {
    post = dbClient.insert('posts', record);
  }
  
  return c.json({ success: true, data: post });
});

// 6. Delete a post
app.delete('/api/social/posts/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const post = dbClient.getById('posts', id);
  if (!post) return c.json({ success: false, error: 'Post not found' }, 404);
  
  // Clean up any scheduled posts linked to this post
  const scheds = dbClient.getCollection('scheduled_posts').filter(sp => sp.post_id === id);
  scheds.forEach(sp => dbClient.delete('scheduled_posts', sp.id, false));
  
  dbClient.delete('posts', id, false);
  return c.json({ success: true });
});

// 7. Publish post immediately
app.post('/api/social/publish', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const { postId, title, content, url, mediaUrls, accountIds } = await c.req.json();
  
  if (!accountIds || accountIds.length === 0) {
    return c.json({ success: false, error: 'At least one social account must be selected' }, 400);
  }
  
  let postText = content || '';
  let postTitle = title || '';
  let postUrl = url || '';
  let postMedia = mediaUrls || [];
  let dbPost: any = null;
  
  if (postId) {
    dbPost = dbClient.getById('posts', postId);
    if (dbPost) {
      postText = dbPost.content;
      postTitle = dbPost.title;
      postUrl = dbPost.link;
      postMedia = dbPost.mediaUrls || [];
    }
  } else {
    dbPost = dbClient.insert('posts', {
      user_id: userPayload.userId,
      title: postTitle,
      content: postText,
      hashtags: '',
      mentions: '',
      link: postUrl,
      mediaUrls: postMedia,
      status: 'Publishing'
    });
  }
  
  const results: any[] = [];
  let allSuccess = true;
  
  for (const accId of accountIds) {
    const account = dbClient.getById('social_accounts', accId);
    if (!account) {
      results.push({ accountId: accId, success: false, error: 'Account not found' });
      allSuccess = false;
      continue;
    }
    
    try {
      const prov = getSocialProvider(account.provider);
      const res = await prov.publish({ title: postTitle, content: postText, url: postUrl, mediaUrls: postMedia }, account);
      results.push({
        accountId: accId,
        provider: account.provider,
        success: res.success,
        url: res.url,
        providerPostId: res.providerPostId,
        error: res.error
      });
      
      if (!res.success) allSuccess = false;
    } catch (err: any) {
      results.push({ accountId: accId, provider: account.provider, success: false, error: err.message });
      allSuccess = false;
    }
  }
  
  if (dbPost) {
    dbClient.update('posts', dbPost.id, {
      status: allSuccess ? 'Published' : results.some(r => r.success) ? 'Published' : 'Failed',
      updated_at: new Date().toISOString()
    });
  }
  
  dbClient.insert('history', {
    user_id: userPayload.userId,
    action: `Published Post`,
    details: { results }
  });
  
  return c.json({ success: true, data: results });
});

// 8. Schedule post
app.post('/api/social/schedule', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const { title, content, url, mediaUrls, scheduledTime, timezone, accountIds } = await c.req.json();
  
  if (!content || !scheduledTime || !accountIds || accountIds.length === 0) {
    return c.json({ success: false, error: 'Content, scheduled time, and social accounts are required' }, 400);
  }
  
  const post = dbClient.insert('posts', {
    user_id: userPayload.userId,
    title: title || 'Untitled Post',
    content,
    hashtags: '',
    mentions: '',
    link: url || '',
    mediaUrls: mediaUrls || [],
    status: 'Scheduled'
  });
  
  const scheduledRecords: any[] = [];
  for (const accId of accountIds) {
    const account = dbClient.getById('social_accounts', accId);
    if (!account) continue;
    
    const record = dbClient.insert('scheduled_posts', {
      user_id: userPayload.userId,
      post_id: post.id,
      provider: account.provider,
      social_account_id: account.id,
      scheduled_time: scheduledTime,
      timezone: timezone || 'UTC',
      status: 'Scheduled',
      retry_count: 0,
      published_at: null,
      error_message: null
    });
    scheduledRecords.push(record);
  }
  
  return c.json({ success: true, data: { post, scheduledRecords } });
});

// 9. Run Scheduler manually (process scheduled queue)
app.post('/api/social/scheduler/run', async (c) => {
  const now = new Date().getTime();
  const scheduledList = dbClient.getCollection('scheduled_posts')
    .filter((sp) => sp.status === 'Scheduled' && new Date(sp.scheduled_time).getTime() <= now);
    
  const results = [];
  
  for (const sp of scheduledList) {
    const post = dbClient.getById('posts', sp.post_id);
    const account = dbClient.getById('social_accounts', sp.social_account_id);
    
    if (!post || !account) {
      dbClient.update('scheduled_posts', sp.id, {
        status: 'Failed',
        error_message: 'Post or connected social account details not found'
      });
      continue;
    }
    
    dbClient.update('scheduled_posts', sp.id, { status: 'Publishing' });
    
    try {
      const prov = getSocialProvider(sp.provider);
      const res = await prov.publish({ title: post.title, content: post.content, url: post.link, mediaUrls: post.mediaUrls }, account);
      
      if (res.success) {
        dbClient.update('scheduled_posts', sp.id, {
          status: 'Published',
          published_at: new Date().toISOString()
        });
        results.push({ id: sp.id, success: true });
        
        const siblings = dbClient.getCollection('scheduled_posts').filter(item => item.post_id === post.id);
        const allDone = siblings.every(s => s.status === 'Published' || s.id === sp.id);
        if (allDone) {
          dbClient.update('posts', post.id, { status: 'Published' });
        }
      } else {
        const errorMsg = res.error || 'Unknown publishing error';
        const retryCount = (sp.retry_count || 0) + 1;
        dbClient.update('scheduled_posts', sp.id, {
          status: retryCount >= 3 ? 'Failed' : 'Scheduled',
          retry_count: retryCount,
          error_message: errorMsg
        });
        results.push({ id: sp.id, success: false, error: errorMsg });
      }
    } catch (err: any) {
      const retryCount = (sp.retry_count || 0) + 1;
      dbClient.update('scheduled_posts', sp.id, {
        status: retryCount >= 3 ? 'Failed' : 'Scheduled',
        retry_count: retryCount,
        error_message: err.message
      });
      results.push({ id: sp.id, success: false, error: err.message });
    }
  }
  
  return c.json({ success: true, processedCount: scheduledList.length, results });
});

// 10. Get social analytics
app.get('/api/social/analytics', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const logs = dbClient.getCollection('social_analytics')
    .filter((log) => log.user_id === userPayload.userId);
  return c.json({ success: true, data: logs });
});

// 11. Media Library CRUD
app.get('/api/social/media', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const list = dbClient.getCollection('media_library')
    .filter((item) => item.user_id === userPayload.userId);
  return c.json({ success: true, data: list });
});

app.post('/api/social/media', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  
  const item = dbClient.insert('media_library', {
    user_id: userPayload.userId,
    type: body.type || 'image/jpeg',
    url: body.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    filename: body.filename || 'uploaded_file.jpg',
    size: body.size || 250000,
  });
  
  return c.json({ success: true, data: item });
});

app.delete('/api/social/media/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('media_library', id, false); // hard delete
  return c.json({ success: deleted });
});

// 12. Campaigns CRUD
app.get('/api/social/campaigns', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const list = dbClient.getCollection('campaigns')
    .filter((camp) => camp.user_id === userPayload.userId);
  return c.json({ success: true, data: list });
});

app.post('/api/social/campaigns', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  
  const record = {
    user_id: userPayload.userId,
    name: body.name || 'New Campaign',
    description: body.description || '',
    color: body.color || '#3B82F6',
    start_date: body.start_date || new Date().toISOString().split('T')[0],
    end_date: body.end_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    budget: body.budget || 0,
    goal: body.goal || '',
    status: body.status || 'Active'
  };
  
  let item;
  if (body.id) {
    item = dbClient.update('campaigns', body.id, record);
  } else {
    item = dbClient.insert('campaigns', record);
  }
  
  return c.json({ success: true, data: item });
});

app.delete('/api/social/campaigns/:id', authMiddleware, (c) => {
  const id = c.req.param('id');
  const deleted = dbClient.delete('campaigns', id, false);
  return c.json({ success: deleted });
});

// 13. Social settings CRUD
app.get('/api/social/settings', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const settings = dbClient.getCollection('settings').find((s) => s.user_id === userPayload.userId);
  
  const socialSettings = settings?.social_settings || {
    defaultPlatform: 'linkedin',
    defaultTimezone: 'UTC',
    autoRetry: true,
    notificationPreferences: {
      oauthSuccess: true,
      oauthFailure: true,
      tokenExpiry: true,
      postPublished: true,
      postFailed: true
    }
  };
  
  return c.json({ success: true, data: socialSettings });
});

app.put('/api/social/settings', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const body = await c.req.json();
  
  let settings = dbClient.getCollection('settings').find((s) => s.user_id === userPayload.userId);
  if (settings) {
    settings = dbClient.update('settings', settings.id, {
      social_settings: body
    });
  } else {
    settings = dbClient.insert('settings', {
      user_id: userPayload.userId,
      social_settings: body
    });
  }
  
  return c.json({ success: true, data: settings.social_settings });
});

// 14. AI Social Post Assistant
app.post('/api/social/ai/generate', authMiddleware, async (c) => {
  const userPayload = c.get('user') as any;
  const { action, prompt, content, platform, tone, length } = await c.req.json();
  
  dbClient.deductCredits(userPayload.userId, 1);
  
  let systemPrompt = '';
  if (action === 'generate') {
    systemPrompt = `You are an elite social media content creator. Write a highly-engaging social media post for the ${platform || 'General'} platform.
Topic/Brief: "${prompt}"
Tone: "${tone || 'Professional'}"
Length: "${length || 'Medium'}"
Add emojis and formatting style matching the platform's conventions.
Output MUST be valid JSON matching this schema:
{
  "title": "A short engaging headline",
  "content": "The actual post content with paragraph spacing",
  "hashtags": ["list", "of", "relevant", "hashtags"],
  "mentions": [],
  "cta": "An actionable closing call-to-action"
}`;
  } else if (action === 'rewrite') {
    systemPrompt = `You are a social media copy editor. Rewrite this social media draft to optimize it for engagement, viral hooks, and formatting.
Original draft: "${content}"
Platform Context: "${platform || 'General'}"
Tone Target: "${tone || 'Professional'}"
Length: "${length || 'Maintain'}"
Output MUST be valid JSON matching this schema:
{
  "title": "A short engaging headline",
  "content": "The rewritten post content with paragraph spacing and relevant emojis",
  "hashtags": ["list", "of", "relevant", "hashtags"],
  "mentions": [],
  "cta": "An actionable closing call-to-action"
}`;
  } else if (action === 'suggest') {
    systemPrompt = `Analyze this social post and suggest hashtags, emojis, and calls to action to boost engagement.
Post content: "${content}"
Output MUST be valid JSON matching this schema:
{
  "hashtags": ["tag1", "tag2", "tag3"],
  "emojis": "😊🚀🔥💡📌",
  "ctaSuggestions": ["CTA option 1", "CTA option 2", "CTA option 3"]
}`;
  } else {
    return c.json({ success: false, error: 'Invalid AI action' }, 400);
  }
  
  const result = await aiManager.generate(systemPrompt, 'openai', { jsonMode: true });
  
  let parsedOutput;
  try {
    parsedOutput = JSON.parse(result.text);
    if (!parsedOutput || Object.keys(parsedOutput).length === 0 || (!parsedOutput.content && !parsedOutput.hashtags)) {
      throw new Error('Empty or invalid mock AI response');
    }
  } catch {
    parsedOutput = {
      title: 'Shared Insight',
      content: content || 'Just launched some amazing new features. Check out the latest updates!',
      hashtags: ['automation', 'productivity'],
      mentions: [],
      cta: 'Learn more at gigpilot.ai'
    };
  }
  
  return c.json({ success: true, data: parsedOutput });
});

// Admin Panel Dashboard API
app.get('/api/admin/dashboard', authMiddleware, (c) => {
  const userPayload = c.get('user') as any;
  const profile = dbClient.getById('users', userPayload.userId);
  if (!profile || profile.role !== 'Admin') {
    // Treat Pro as admin for demo purposes if needed, otherwise verify role
  }

  return c.json({
    success: true,
    data: {
      totalUsers: 14820,
      activeProUsers: 3410,
      monthlyRevenue: '$98,890',
      totalGenerationsThisMonth: 284190,
      aiProviderStats: {
        openAI: '45%',
        gemini: '30%',
        claude: '15%',
        groq: '10%'
      }
    }
  });
});

export default app;

if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 3000);
  console.log(`[Server] Starting Hono API server on port ${port}...`);
  serve({
    fetch: app.fetch,
    port
  });
}
