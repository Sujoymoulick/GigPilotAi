import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../services/AuthService';
import { aiService } from '../services/AiService';
import { socialService } from '../services/SocialService';
import { analyticsService } from '../services/AnalyticsService';
import { notificationService } from '../services/NotificationService';
import { billingService } from '../services/BillingService';
import { settingsService } from '../services/SettingsService';
import { storageService } from '../services/StorageService';
import { BadRequestError } from '../errors/AppError';

import {
  loginSchema,
  magicLinkSchema,
  upgradeSchema,
  proposalGenerateSchema,
  gigGenerateSchema,
  keywordsFindSchema,
  pricingOptimizeSchema,
  gigHealthCheckSchema,
  portfolioGenerateSchema,
  clientMessageReplySchema,
  reviewAnalyzeSchema,
  seoAuditSchema,
  connectSocialSchema,
  disconnectSocialSchema,
  postCrudSchema,
  postPublishSchema,
  postScheduleSchema,
  socialSettingsSchema,
  socialAiGenerateSchema
} from '../validators';

// Custom request mapping type
export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
  token?: string;
}

// Helper to format success output
const successResponse = (reply: FastifyReply, data: any, message: string = '', statusCode: number = 200) => {
  return reply.code(statusCode).send({
    success: true,
    message,
    data
  });
};

// 1. AuthController
export class AuthController {
  public async login(req: FastifyRequest, reply: FastifyReply) {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      throw new BadRequestError('Validation Failed', validated.error.format());
    }

    const { email, fullName } = validated.data;
    const authHeader = req.headers['authorization'];
    const token = authHeader ? authHeader.replace('Bearer ', '') : undefined;

    const result = await authService.loginAndSync(email, fullName, token);
    return successResponse(reply, result, 'Logged in successfully');
  }

  public async magicLink(req: FastifyRequest, reply: FastifyReply) {
    const validated = magicLinkSchema.safeParse(req.body);
    if (!validated.success) {
      throw new BadRequestError('Validation Failed', validated.error.format());
    }

    const { email } = validated.data;
    const magicUrl = `https://gigpilot.ai/auth/magic-verify?token=${Buffer.from(
      JSON.stringify({ email, exp: Date.now() + 15 * 60 * 1000 })
    ).toString('base64url')}`;
    
    return successResponse(reply, { magicUrl }, 'Magic link generated successfully');
  }

  public async me(req: AuthenticatedRequest, reply: FastifyReply) {
    const userId = req.user!.userId;
    const profile = await userRepository.queryById<any>(userId, req.token);
    return successResponse(reply, profile || {}, 'Profile details loaded');
  }
}

// 2. AiController
export class AiController {
  public async getHistory(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await aiService.getHistory(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async deleteHistory(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    const success = await aiService.deleteHistory(id, req.token);
    return successResponse(reply, { success });
  }

  public async clearHistory(req: AuthenticatedRequest, reply: FastifyReply) {
    await aiService.clearHistory(req.user!.userId, req.token);
    return successResponse(reply, { success: true });
  }

  public async toggleFavorite(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.body as { id: string };
    const isFavorite = await aiService.toggleFavorite(id, req.token);
    return successResponse(reply, { isFavorite });
  }

  public async generateProposal(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = proposalGenerateSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.generateProposal(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async generateGig(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = gigGenerateSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const result = await aiService.generateGig(req.user!.userId, validated.data, req.token);
    return reply.code(200).send({
      success: true,
      message: '',
      data: result.output,
      meta: result.meta
    });
  }

  public async findKeywords(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = keywordsFindSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.findKeywords(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async optimizePricing(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = pricingOptimizeSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.optimizePricing(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async checkGigHealth(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = gigHealthCheckSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.checkGigHealth(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async generatePortfolio(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = portfolioGenerateSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.generatePortfolio(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async replyMessage(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = clientMessageReplySchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.replyMessage(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async analyzeReviews(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = reviewAnalyzeSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.analyzeReviews(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }

  public async auditSeo(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = seoAuditSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const record = await aiService.auditSeo(req.user!.userId, validated.data, req.token);
    return successResponse(reply, record);
  }
}

// 3. SocialController
export class SocialController {
  public async getAccounts(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await socialService.getAccounts(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async connectAccount(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = connectSocialSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const account = await socialService.connectAccount(req.user!.userId, validated.data, req.token);
    return successResponse(reply, account);
  }

  public async disconnectAccount(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = disconnectSocialSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    await socialService.disconnectAccount(req.user!.userId, validated.data.accountId, req.token);
    return successResponse(reply, { success: true }, 'Social account disconnected');
  }

  public async getPosts(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await socialService.getPosts(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async createOrUpdatePost(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = postCrudSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const post = await socialService.createOrUpdatePost(req.user!.userId, validated.data, req.token);
    return successResponse(reply, post);
  }

  public async deletePost(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    await socialService.deletePost(req.user!.userId, id, req.token);
    return successResponse(reply, { success: true }, 'Post deleted');
  }

  public async publishPostImmediate(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = postPublishSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const results = await socialService.publishPostImmediate(req.user!.userId, validated.data, req.token);
    return successResponse(reply, results);
  }

  public async schedulePost(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = postScheduleSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const result = await socialService.schedulePost(req.user!.userId, validated.data, req.token);
    return successResponse(reply, result);
  }

  public async runScheduler(req: FastifyRequest, reply: FastifyReply) {
    const results = await socialService.runScheduler();
    return reply.code(200).send({
      success: true,
      processedCount: results.length,
      results
    });
  }

  public async getCampaigns(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await socialService.getCampaigns(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async createOrUpdateCampaign(req: AuthenticatedRequest, reply: FastifyReply) {
    const postData = req.body as any;
    const campaign = await socialService.createOrUpdateCampaign(req.user!.userId, postData, req.token);
    return successResponse(reply, campaign);
  }

  public async deleteCampaign(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    await socialService.deleteCampaign(req.user!.userId, id, req.token);
    return successResponse(reply, { success: true });
  }

  public async getMedia(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await socialService.getMedia(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async addMedia(req: AuthenticatedRequest, reply: FastifyReply) {
    const postData = req.body as any;
    const item = await socialService.addMedia(req.user!.userId, postData, req.token);
    return successResponse(reply, item);
  }

  public async deleteMedia(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    await socialService.deleteMedia(req.user!.userId, id, req.token);
    return successResponse(reply, { success: true });
  }

  public async getAnalytics(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await socialService.getAnalytics(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async getSettings(req: AuthenticatedRequest, reply: FastifyReply) {
    const settings = await settingsService.getSettings(req.user!.userId, req.token);
    return successResponse(reply, settings.social_settings || {});
  }

  public async updateSettings(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = socialSettingsSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const settings = await settingsService.updateSettings(req.user!.userId, { social_settings: validated.data }, req.token);
    return successResponse(reply, settings.social_settings);
  }

  public async aiGenerate(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = socialAiGenerateSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const result = await aiService.generateSocialPost(req.user!.userId, validated.data, req.token);
    return successResponse(reply, result);
  }
}

// 4. AnalyticsController
export class AnalyticsController {
  public async getDashboard(req: AuthenticatedRequest, reply: FastifyReply) {
    const data = await analyticsService.getDashboardData(req.user!.userId, req.token);
    return successResponse(reply, data);
  }
}

// 5. NotificationController
export class NotificationController {
  public async getNotifications(req: AuthenticatedRequest, reply: FastifyReply) {
    const list = await notificationService.getNotifications(req.user!.userId, req.token);
    return successResponse(reply, list);
  }

  public async getUnreadCount(req: AuthenticatedRequest, reply: FastifyReply) {
    const count = await notificationService.getUnreadCount(req.user!.userId, req.token);
    return successResponse(reply, { count });
  }

  public async markAllRead(req: AuthenticatedRequest, reply: FastifyReply) {
    await notificationService.markAllAsRead(req.user!.userId, req.token);
    return successResponse(reply, { success: true });
  }

  public async delete(req: AuthenticatedRequest, reply: FastifyReply) {
    const { id } = req.params as { id: string };
    await notificationService.deleteNotification(id, req.token);
    return successResponse(reply, { success: true });
  }
}

// 6. BillingController
export class BillingController {
  public async getBilling(req: AuthenticatedRequest, reply: FastifyReply) {
    const data = await billingService.getBillingDetails(req.user!.userId, req.token);
    return successResponse(reply, data);
  }

  public async upgrade(req: AuthenticatedRequest, reply: FastifyReply) {
    const validated = upgradeSchema.safeParse(req.body);
    if (!validated.success) throw new BadRequestError('Validation Failed', validated.error.format());
    
    const invoice = await billingService.upgradePlan(req.user!.userId, validated.data, req.token);
    return successResponse(reply, { invoice }, `Successfully upgraded to ${validated.data.plan} Plan!`);
  }
}

// 7. SettingsController
export class SettingsController {
  public async getSettings(req: AuthenticatedRequest, reply: FastifyReply) {
    const settings = await settingsService.getSettings(req.user!.userId, req.token);
    return successResponse(reply, settings);
  }

  public async updateSettings(req: AuthenticatedRequest, reply: FastifyReply) {
    const body = req.body as any;
    const settings = await settingsService.updateSettings(req.user!.userId, body, req.token);
    return successResponse(reply, settings);
  }
}

// 8. StorageController
export class StorageController {
  public async upload(req: AuthenticatedRequest, reply: FastifyReply) {
    // Standard file upload processing using fastify-multipart or plain base64/buffer payload.
    // For general compatibility with existing JSON post payloads, we support body-based file uploads (base64).
    const body = req.body as { filename: string; contentType: string; data: string }; // data is base64 string
    if (!body.filename || !body.data) {
      throw new BadRequestError('Missing filename or base64 file data');
    }

    const buffer = Buffer.from(body.data, 'base64');
    const result = await storageService.uploadFile(
      req.user!.userId,
      body.filename,
      buffer,
      body.contentType || 'image/jpeg',
      req.token
    );

    return successResponse(reply, result, 'File uploaded successfully');
  }
}

// UserRepository local helper import for AuthController.me
import { userRepository } from '../repositories';

// Instances
export const authController = new AuthController();
export const aiController = new AiController();
export const socialController = new SocialController();
export const analyticsController = new AnalyticsController();
export const notificationController = new NotificationController();
export const billingController = new BillingController();
export const settingsController = new SettingsController();
export const storageController = new StorageController();
