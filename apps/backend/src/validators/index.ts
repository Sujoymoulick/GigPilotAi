import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  fullName: z.string().optional(),
});

export const magicLinkSchema = z.object({
  email: z.string().email(),
});

// Billing
export const upgradeSchema = z.object({
  plan: z.enum(['Free', 'Pro', 'Agency']),
  razorpayPaymentId: z.string().optional(),
  coupon: z.string().optional(),
});

// AI Module
export const proposalGenerateSchema = z.object({
  jobDescription: z.string().min(10),
  myService: z.string().min(3),
  tone: z.string().optional(),
  provider: z.string().optional(),
});

export const gigGenerateSchema = z.object({
  service: z.string().min(3),
  category: z.string().optional(),
  provider: z.string().optional(),
});

export const keywordsFindSchema = z.object({
  service: z.string().min(2),
  provider: z.string().optional(),
});

export const pricingOptimizeSchema = z.object({
  experience: z.string(),
  category: z.string(),
  country: z.string(),
  competition: z.enum(['Low', 'Medium', 'High']),
  deliveryTimeDays: z.coerce.number(),
  provider: z.string().optional(),
});

export const gigHealthCheckSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  faqs: z.string().optional(),
  packages: z.string().optional(),
  tags: z.string().optional(),
  provider: z.string().optional(),
});

export const portfolioGenerateSchema = z.object({
  role: z.string().min(3),
  skills: z.array(z.string()).min(1),
  provider: z.string().optional(),
});

export const clientMessageReplySchema = z.object({
  clientMessage: z.string().min(5),
  type: z.string(),
  provider: z.string().optional(),
});

export const reviewAnalyzeSchema = z.object({
  reviewsText: z.string().min(10),
  provider: z.string().optional(),
});

export const seoAuditSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  keywords: z.array(z.string()).min(1),
  provider: z.string().optional(),
});

// Social accounts & posts
export const connectSocialSchema = z.object({
  provider: z.string(),
  code: z.string(),
  redirectUri: z.string().url().optional(),
});

export const disconnectSocialSchema = z.object({
  accountId: z.string(),
});

export const postCrudSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  content: z.string().min(1),
  hashtags: z.string().optional(),
  mentions: z.string().optional(),
  link: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  media_urls: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const postPublishSchema = z.object({
  postId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  url: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string()).optional(),
  accountIds: z.array(z.string()).min(1),
});

export const postScheduleSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  url: z.string().url().or(z.literal('')).optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled time format',
  }),
  timezone: z.string().optional(),
  accountIds: z.array(z.string()).min(1),
});

export const socialSettingsSchema = z.object({
  defaultPlatform: z.string().optional(),
  defaultTimezone: z.string().optional(),
  autoRetry: z.boolean().optional(),
  notificationPreferences: z.object({
    oauthSuccess: z.boolean(),
    oauthFailure: z.boolean(),
    tokenExpiry: z.boolean(),
    postPublished: z.boolean(),
    postFailed: z.boolean(),
  }).optional(),
});

export const socialAiGenerateSchema = z.object({
  action: z.enum(['generate', 'rewrite', 'suggest']),
  prompt: z.string().optional(),
  content: z.string().optional(),
  platform: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
});
