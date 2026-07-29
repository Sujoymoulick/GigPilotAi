import type { FastifyInstance } from 'fastify';
import { authenticate } from '../middleware/auth';
import {
  authController,
  aiController,
  socialController,
  analyticsController,
  notificationController,
  billingController,
  settingsController,
  storageController
} from '../controllers';

export async function registerRoutes(fastify: FastifyInstance) {
  // --- HEALTH CHECK ---
  fastify.get('/api/health', async (req, rep) => {
    return rep.send({
      status: 'online',
      system: 'GigPilot AI API Fastify Server',
      timestamp: new Date().toISOString()
    });
  });
  fastify.get('/api/v1/health', async (req, rep) => {
    return rep.send({
      status: 'online',
      system: 'GigPilot AI API Fastify Server',
      timestamp: new Date().toISOString()
    });
  });

  // --- AUTHENTICATION ---
  fastify.post('/api/auth/login', authController.login);
  fastify.post('/api/auth/magic-link', authController.magicLink);
  fastify.get('/api/auth/me', { preHandler: [authenticate] }, authController.me);

  fastify.post('/api/v1/auth/login', authController.login);
  fastify.post('/api/v1/auth/magic-link', authController.magicLink);
  fastify.get('/api/v1/auth/me', { preHandler: [authenticate] }, authController.me);

  // --- AI GENERATIVE ENGINE & HISTORY ---
  fastify.get('/api/history', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.delete('/api/history/:id', { preHandler: [authenticate] }, aiController.deleteHistory);
  fastify.delete('/api/history', { preHandler: [authenticate] }, aiController.clearHistory);
  
  fastify.get('/api/v1/ai/history', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.delete('/api/v1/ai/history/:id', { preHandler: [authenticate] }, aiController.deleteHistory);
  fastify.delete('/api/v1/ai/history', { preHandler: [authenticate] }, aiController.clearHistory);

  // Favorites
  fastify.get('/api/favorites', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/favorites/toggle', { preHandler: [authenticate] }, aiController.toggleFavorite);

  fastify.get('/api/v1/ai/favorites', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/favorites/toggle', { preHandler: [authenticate] }, aiController.toggleFavorite);

  // Proposal Generator
  fastify.get('/api/proposals', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/proposal/generate', { preHandler: [authenticate] }, aiController.generateProposal);
  fastify.put('/api/proposals/:id', { preHandler: [authenticate] }, aiController.generateProposal); // Update outputs
  fastify.delete('/api/proposals/:id', { preHandler: [authenticate] }, aiController.deleteHistory);

  fastify.get('/api/v1/projects/proposals', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/projects/proposals/generate', { preHandler: [authenticate] }, aiController.generateProposal);
  fastify.delete('/api/v1/projects/proposals/:id', { preHandler: [authenticate] }, aiController.deleteHistory);

  // Gig Generator
  fastify.get('/api/gigs', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/gig/generate', { preHandler: [authenticate] }, aiController.generateGig);
  fastify.put('/api/gigs/:id', { preHandler: [authenticate] }, aiController.generateGig);
  fastify.delete('/api/gigs/:id', { preHandler: [authenticate] }, aiController.deleteHistory);

  fastify.get('/api/v1/gigs', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/gigs/generate', { preHandler: [authenticate] }, aiController.generateGig);

  // Keyword Finder
  fastify.get('/api/keywords', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/keywords/find', { preHandler: [authenticate] }, aiController.findKeywords);
  fastify.delete('/api/keywords/:id', { preHandler: [authenticate] }, aiController.deleteHistory);

  fastify.get('/api/v1/ai/keywords', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/keywords/find', { preHandler: [authenticate] }, aiController.findKeywords);

  // Pricing Optimizer
  fastify.get('/api/pricing', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/pricing/optimize', { preHandler: [authenticate] }, aiController.optimizePricing);

  fastify.get('/api/v1/ai/pricing', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/pricing/optimize', { preHandler: [authenticate] }, aiController.optimizePricing);

  // Gig Health Checker
  fastify.get('/api/gig/health', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/gig/health', { preHandler: [authenticate] }, aiController.checkGigHealth);

  fastify.get('/api/v1/gigs/health', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/gigs/health/check', { preHandler: [authenticate] }, aiController.checkGigHealth);

  // Portfolio Builder
  fastify.get('/api/portfolio', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/portfolio/generate', { preHandler: [authenticate] }, aiController.generatePortfolio);
  fastify.delete('/api/portfolio/:id', { preHandler: [authenticate] }, aiController.deleteHistory);

  fastify.get('/api/v1/ai/portfolio', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/portfolio/generate', { preHandler: [authenticate] }, aiController.generatePortfolio);

  // Client Message Reply
  fastify.get('/api/messages', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/messages/reply', { preHandler: [authenticate] }, aiController.replyMessage);

  fastify.get('/api/v1/ai/messages', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/messages/reply', { preHandler: [authenticate] }, aiController.replyMessage);

  // Review Analyzer
  fastify.get('/api/reviews', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/reviews/analyze', { preHandler: [authenticate] }, aiController.analyzeReviews);

  fastify.get('/api/v1/ai/reviews', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/reviews/analyze', { preHandler: [authenticate] }, aiController.analyzeReviews);

  // SEO Audit
  fastify.get('/api/seo', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/seo/audit', { preHandler: [authenticate] }, aiController.auditSeo);

  fastify.get('/api/v1/ai/seo', { preHandler: [authenticate] }, aiController.getHistory);
  fastify.post('/api/v1/ai/seo/audit', { preHandler: [authenticate] }, aiController.auditSeo);

  // --- SOCIAL MEDIA HUB ---
  fastify.get('/api/social/accounts', { preHandler: [authenticate] }, socialController.getAccounts);
  fastify.post('/api/social/connect', { preHandler: [authenticate] }, socialController.connectAccount);
  fastify.post('/api/social/disconnect', { preHandler: [authenticate] }, socialController.disconnectAccount);
  fastify.get('/api/social/posts', { preHandler: [authenticate] }, socialController.getPosts);
  fastify.post('/api/social/posts', { preHandler: [authenticate] }, socialController.createOrUpdatePost);
  fastify.delete('/api/social/posts/:id', { preHandler: [authenticate] }, socialController.deletePost);
  fastify.post('/api/social/publish', { preHandler: [authenticate] }, socialController.publishPostImmediate);
  fastify.post('/api/social/schedule', { preHandler: [authenticate] }, socialController.schedulePost);
  fastify.post('/api/social/scheduler/run', socialController.runScheduler);
  fastify.get('/api/social/analytics', { preHandler: [authenticate] }, socialController.getAnalytics);
  fastify.get('/api/social/media', { preHandler: [authenticate] }, socialController.getMedia);
  fastify.post('/api/social/media', { preHandler: [authenticate] }, socialController.addMedia);
  fastify.delete('/api/social/media/:id', { preHandler: [authenticate] }, socialController.deleteMedia);
  fastify.get('/api/social/campaigns', { preHandler: [authenticate] }, socialController.getCampaigns);
  fastify.post('/api/social/campaigns', { preHandler: [authenticate] }, socialController.createOrUpdateCampaign);
  fastify.delete('/api/social/campaigns/:id', { preHandler: [authenticate] }, socialController.deleteCampaign);
  fastify.get('/api/social/settings', { preHandler: [authenticate] }, socialController.getSettings);
  fastify.put('/api/social/settings', { preHandler: [authenticate] }, socialController.updateSettings);
  fastify.post('/api/social/ai/generate', { preHandler: [authenticate] }, socialController.aiGenerate);

  fastify.get('/api/v1/social/accounts', { preHandler: [authenticate] }, socialController.getAccounts);
  fastify.post('/api/v1/social/connect', { preHandler: [authenticate] }, socialController.connectAccount);
  fastify.post('/api/v1/social/disconnect', { preHandler: [authenticate] }, socialController.disconnectAccount);
  fastify.get('/api/v1/social/posts', { preHandler: [authenticate] }, socialController.getPosts);
  fastify.post('/api/v1/social/posts', { preHandler: [authenticate] }, socialController.createOrUpdatePost);
  fastify.delete('/api/v1/social/posts/:id', { preHandler: [authenticate] }, socialController.deletePost);
  fastify.post('/api/v1/social/publish', { preHandler: [authenticate] }, socialController.publishPostImmediate);
  fastify.post('/api/v1/social/schedule', { preHandler: [authenticate] }, socialController.schedulePost);
  fastify.get('/api/v1/social/analytics', { preHandler: [authenticate] }, socialController.getAnalytics);
  fastify.get('/api/v1/social/media', { preHandler: [authenticate] }, socialController.getMedia);
  fastify.post('/api/v1/social/media', { preHandler: [authenticate] }, socialController.addMedia);
  fastify.delete('/api/v1/social/media/:id', { preHandler: [authenticate] }, socialController.deleteMedia);
  fastify.get('/api/v1/social/campaigns', { preHandler: [authenticate] }, socialController.getCampaigns);
  fastify.post('/api/v1/social/campaigns', { preHandler: [authenticate] }, socialController.createOrUpdateCampaign);
  fastify.delete('/api/v1/social/campaigns/:id', { preHandler: [authenticate] }, socialController.deleteCampaign);
  fastify.get('/api/v1/social/settings', { preHandler: [authenticate] }, socialController.getSettings);
  fastify.put('/api/v1/social/settings', { preHandler: [authenticate] }, socialController.updateSettings);
  fastify.post('/api/v1/social/ai/generate', { preHandler: [authenticate] }, socialController.aiGenerate);

  // --- ANALYTICS DASHBOARD ---
  fastify.get('/api/analytics', { preHandler: [authenticate] }, analyticsController.getDashboard);
  fastify.get('/api/v1/analytics', { preHandler: [authenticate] }, analyticsController.getDashboard);

  // --- NOTIFICATIONS SYSTEM ---
  fastify.get('/api/notifications', { preHandler: [authenticate] }, notificationController.getNotifications);
  fastify.get('/api/notifications/unread', { preHandler: [authenticate] }, notificationController.getUnreadCount);
  fastify.post('/api/notifications/read-all', { preHandler: [authenticate] }, notificationController.markAllRead);
  fastify.delete('/api/notifications/:id', { preHandler: [authenticate] }, notificationController.delete);

  fastify.get('/api/v1/notifications', { preHandler: [authenticate] }, notificationController.getNotifications);
  fastify.get('/api/v1/notifications/unread', { preHandler: [authenticate] }, notificationController.getUnreadCount);
  fastify.post('/api/v1/notifications/read-all', { preHandler: [authenticate] }, notificationController.markAllRead);
  fastify.delete('/api/v1/notifications/:id', { preHandler: [authenticate] }, notificationController.delete);

  // --- BILLING / PAYMENTS ---
  fastify.get('/api/billing', { preHandler: [authenticate] }, billingController.getBilling);
  fastify.post('/api/billing/upgrade', { preHandler: [authenticate] }, billingController.upgrade);

  fastify.get('/api/v1/payments/billing', { preHandler: [authenticate] }, billingController.getBilling);
  fastify.post('/api/v1/payments/upgrade', { preHandler: [authenticate] }, billingController.upgrade);

  // --- SETTINGS CONFIG ---
  fastify.get('/api/settings', { preHandler: [authenticate] }, settingsController.getSettings);
  fastify.put('/api/settings', { preHandler: [authenticate] }, settingsController.updateSettings);

  fastify.get('/api/v1/settings', { preHandler: [authenticate] }, settingsController.getSettings);
  fastify.put('/api/v1/settings', { preHandler: [authenticate] }, settingsController.updateSettings);

  // --- STORAGE & UPLOADS ---
  fastify.post('/api/storage/upload', { preHandler: [authenticate] }, storageController.upload);
  fastify.post('/api/v1/storage/upload', { preHandler: [authenticate] }, storageController.upload);

  // --- GIG DRAFTS ---
  fastify.get('/api/publish/drafts', { preHandler: [authenticate] }, socialController.getPosts);
  fastify.post('/api/publish/drafts', { preHandler: [authenticate] }, socialController.createOrUpdatePost);
  fastify.put('/api/publish/drafts/:id', { preHandler: [authenticate] }, socialController.createOrUpdatePost);

  // --- TEMPLATES ---
  fastify.get('/api/templates', { preHandler: [authenticate] }, socialController.getPosts);
  fastify.post('/api/templates', { preHandler: [authenticate] }, socialController.createOrUpdatePost);
  fastify.put('/api/templates/:id', { preHandler: [authenticate] }, socialController.createOrUpdatePost);
  fastify.delete('/api/templates/:id', { preHandler: [authenticate] }, socialController.deletePost);
}
