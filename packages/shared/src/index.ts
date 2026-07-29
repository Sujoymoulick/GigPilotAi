// User & Auth Types
export type UserRole = 'Free' | 'Pro' | 'Agency' | 'Admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  creditsRemaining: number;
  monthlyQuota: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: number;
}

// Module Types & AI Inputs/Outputs

// Module 1: AI Gig Generator
export interface GigGeneratorInput {
  category: string;
  subcategory: string;
  service: string;
  experience: 'Beginner' | 'Intermediate' | 'Expert' | 'Master';
  targetAudience: string;
  tone: 'Professional' | 'Friendly' | 'Persuasive' | 'Authoritative' | 'Creative';
  country?: string;
  language?: string;
  competitorUrls?: string[];
  additionalNotes?: string;
}

export interface GigPackageTier {
  name: string; // Basic, Standard, Premium
  title: string;
  description: string;
  deliveryDays: number;
  revisions: string;
  price: number;
  features: string[];
}

export interface GigGeneratorOutput {
  seoTitle: string;
  description: string;
  packages: {
    basic: GigPackageTier;
    standard: GigPackageTier;
    premium: GigPackageTier;
  };
  faqs: { question: string; answer: string }[];
  requirements: string[];
  tags: string[];
  callToAction: string;
  imagePrompt: string;
  videoScript: string;
  upsellSuggestions: string[];
}

// Module 2: Proposal Generator
export type ProposalType =
  | 'buyer_request'
  | 'inbox_reply'
  | 'custom_offer'
  | 'revision_reply'
  | 'follow_up'
  | 'cold_pitch'
  | 'support';

export interface ProposalInput {
  type: ProposalType;
  buyerName?: string;
  jobDescription: string;
  myService: string;
  tone: string;
  pricingEstimate?: string;
  deliveryTime?: string;
}

export interface ProposalOutput {
  subjectLine?: string;
  proposalText: string;
  keyHighlights: string[];
  suggestedQuestions: string[];
  callToAction: string;
}

// Module 3: Keyword Finder
export interface KeywordFinderInput {
  service: string;
  category?: string;
}

export interface KeywordMetric {
  keyword: string;
  type: 'primary' | 'long-tail' | 'related' | 'competitor';
  estimatedSearchVolume: number;
  competitionLevel: 'Low' | 'Medium' | 'High';
  difficultyScore: number; // 1 - 100
  opportunityScore: number; // 1 - 100
  trend: 'Rising' | 'Stable' | 'Declining';
  intent: 'Informational' | 'Transactional' | 'Commercial';
}

export interface KeywordFinderOutput {
  primaryKeywords: KeywordMetric[];
  longTailKeywords: KeywordMetric[];
  relatedSearches: KeywordMetric[];
  competitorKeywords: KeywordMetric[];
  summary: {
    avgDifficulty: number;
    avgOpportunity: number;
    recommendedFocus: string[];
  };
}

// Module 4: Pricing Optimizer
export interface PricingOptimizerInput {
  experience: string;
  category: string;
  country: string;
  competition: 'Low' | 'Medium' | 'High';
  deliveryTimeDays: number;
}

export interface PricingOptimizerOutput {
  basicPrice: number;
  standardPrice: number;
  premiumPrice: number;
  recommendedExtras: { name: string; price: number; deliveryDays: number }[];
  recommendedDiscounts: { type: string; percentage: number; rationale: string }[];
  competitiveAnalysis: string;
}

// Module 5: Gig Health Checker
export interface GigHealthInput {
  title: string;
  description: string;
  faqs?: string;
  packages?: string;
  tags?: string;
}

export interface GigHealthOutput {
  overallScore: number; // 0 - 100
  seoScore: number;
  readabilityScore: number;
  ctaScore: number;
  keywordDensityScore: number;
  grammarScore: number;
  trustScore: number;
  conversionScore: number;
  suggestions: {
    category: string;
    severity: 'High' | 'Medium' | 'Low';
    issue: string;
    actionableFix: string;
  }[];
}

// Module 6: Portfolio Builder
export interface PortfolioInput {
  role: string;
  skills: string[];
  pastProjects?: string;
}

export interface PortfolioOutput {
  aboutMe: string;
  caseStudies: { title: string; problem: string; solution: string; outcome: string }[];
  projectDescriptions: { title: string; description: string; tags: string[] }[];
  testimonials: { clientName: string; quote: string; rating: number }[];
  portfolioWebsiteCopy: string;
  linkedInAbout: string;
}

// Module 7: Client Reply Generator
export type ClientReplyType =
  | 'professional'
  | 'friendly'
  | 'upsell'
  | 'refund'
  | 'revision'
  | 'delay'
  | 'order_complete'
  | 'thank_you';

export interface ClientReplyInput {
  type: ClientReplyType;
  clientMessage: string;
  context?: string;
}

export interface ClientReplyOutput {
  replyText: string;
  tone: string;
  alternativeOptions: string[];
}

// Module 8: Review Analyzer
export interface ReviewAnalyzerInput {
  reviewsText: string;
}

export interface ReviewAnalyzerOutput {
  positiveCount: number;
  negativeCount: number;
  overallSentimentScore: number; // -1 to +1 or 0-100
  commonComplaints: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  sentimentBreakdown: { label: string; percentage: number }[];
  topKeywords: { word: string; count: number }[];
}

// Module 9: SEO Audit
export interface SEOAuditInput {
  title: string;
  description: string;
  keywords: string[];
  faqs?: string;
  packages?: string;
}

export interface SEOAuditOutput {
  seoScore: number;
  keywordScore: number;
  ctrPrediction: number; // percentage e.g. 14.5%
  missingKeywords: string[];
  optimizationTips: string[];
  titleSuggestions: string[];
}

// History & Favorites & Templates
export interface GenerationRecord {
  id: string;
  userId: string;
  module: string;
  input: Record<string, any>;
  output: Record<string, any>;
  tokensUsed: number;
  provider: string;
  isFavorite: boolean;
  createdAt: string;
}

export interface TemplateRecord {
  id: string;
  userId?: string;
  title: string;
  category: string;
  type: 'gig' | 'proposal' | 'bio' | 'reply' | 'contract' | 'invoice';
  content: string;
  isCustom: boolean;
  isFavorite: boolean;
  createdAt: string;
}

// API Envelope
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}
