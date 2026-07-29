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
import { aiHistoryRepository, userRepository, gigRepository } from '../repositories';
import { BadRequestError } from '../errors/AppError';
import { aiGenerationQueue } from '../jobs';

export class AiService {
  public async getHistory(userId: string, token?: string) {
    const list = await aiHistoryRepository.getByUser(userId, token);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public async deleteHistory(id: string, token?: string) {
    return aiHistoryRepository.deleteRecord(id, token, false); // hard delete from history
  }

  public async clearHistory(userId: string, token?: string) {
    return aiHistoryRepository.clearAllUserHistory(userId, token);
  }

  public async toggleFavorite(id: string, token?: string) {
    return aiHistoryRepository.toggleFavorite(id, token);
  }

  // Generates proposals and logs them
  public async generateProposal(userId: string, body: any, token?: string) {
    const { jobDescription, myService, provider } = body;
    if (!jobDescription || !myService) {
      throw new BadRequestError('Job description and Service are required');
    }

    // Deduct credit
    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildProposalPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
    } catch {
      parsedOutput = {
        subjectLine: `High-Impact Response: ${myService}`,
        proposalText: `Hello,\n\nI reviewed your project request for: "${jobDescription.slice(0, 100)}...". I am a professional freelancer specializing in ${myService} and am fully ready to deliver top-tier results.`,
        keyHighlights: ['Custom design assets', 'Responsive layout support'],
        suggestedQuestions: ['What are the core timelines for this job?'],
        callToAction: 'Send me a message in inbox to get started right away.'
      };
    }

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Proposal Generator',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    // Queue async background analysis if needed
    aiGenerationQueue.add('analyze-usage', { userId, tokensUsed: result.tokensUsed });

    return record;
  }

  // Generates gig contents and logs them
  public async generateGig(userId: string, body: any, token?: string) {
    const { service, category, provider } = body;
    if (!service) {
      throw new BadRequestError('Service name is required');
    }

    await userRepository.deductCredits(userId, 2, token);

    const prompt = buildGigPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
      if (!parsedOutput || Object.keys(parsedOutput).length === 0 || !parsedOutput.seoTitle) {
        throw new Error('Invalid AI response');
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

    // Save history
    await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Gig Generator',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    // Save to Gigs Repository (database)
    const record = await gigRepository.insertRecord<any>({
      user_id: userId,
      title: parsedOutput.seoTitle,
      category: category || 'Web Programming',
      content: parsedOutput,
      status: 'draft'
    }, token);

    return {
      output: record,
      meta: { tokensUsed: result.tokensUsed, provider: result.provider }
    };
  }

  // Keywords search
  public async findKeywords(userId: string, body: any, token?: string) {
    const { service, provider } = body;
    if (!service) throw new BadRequestError('Service is required');

    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildKeywordsPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

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

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Keyword Finder',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Pricing optimization
  public async optimizePricing(userId: string, body: any, token?: string) {
    const { provider } = body;
    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildPricingPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
    } catch {
      parsedOutput = {
        basicPrice: 20, standardPrice: 50, premiumPrice: 120,
        recommendedExtras: [], recommendedDiscounts: [], competitiveAnalysis: 'Sweet spot analysis.'
      };
    }

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Pricing Optimizer',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Gig Health
  public async checkGigHealth(userId: string, body: any, token?: string) {
    const { provider } = body;
    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildGigHealthPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

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

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Gig Health Checker',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Portfolio copy generator
  public async generatePortfolio(userId: string, body: any, token?: string) {
    const { role, skills, provider } = body;
    if (!role || !skills) {
      throw new BadRequestError('Role and Skills are required');
    }

    await userRepository.deductCredits(userId, 2, token);

    const prompt = buildPortfolioPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
    } catch {
      parsedOutput = {
        aboutMe: `I am an expert freelance professional specialized in ${role}.`,
        caseStudies: [], projectDescriptions: [], testimonials: [], portfolioWebsiteCopy: '', linkedInAbout: ''
      };
    }

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Portfolio Builder',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Client messages reply
  public async replyMessage(userId: string, body: any, token?: string) {
    const { clientMessage, type, provider } = body;
    if (!clientMessage) {
      throw new BadRequestError('Client message is required');
    }

    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildReplyPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

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

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Client Messages',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Review analyzer
  public async analyzeReviews(userId: string, body: any, token?: string) {
    const { reviewsText, provider } = body;
    if (!reviewsText) throw new BadRequestError('Reviews content is required');

    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildReviewPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

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

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Review Analyzer',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // SEO Audit
  public async auditSeo(userId: string, body: any, token?: string) {
    const { title, description, keywords, provider } = body;
    if (!title || !description || !keywords) {
      throw new BadRequestError('Title, description and keywords are required');
    }

    await userRepository.deductCredits(userId, 1, token);

    const prompt = buildSEOAuditPrompt(body);
    const result = await aiManager.generate(prompt, provider, { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
    } catch {
      parsedOutput = {
        seoScore: 78, keywordScore: 80, ctrPrediction: 9.5,
        missingKeywords: [], optimizationTips: [], titleSuggestions: []
      };
    }

    const record = await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'SEO Audit',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return record;
  }

  // Social media post generator
  public async generateSocialPost(userId: string, body: any, token?: string) {
    const { action, prompt, content, platform, tone, length } = body;

    await userRepository.deductCredits(userId, 1, token);

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
      throw new BadRequestError('Invalid AI action');
    }

    const result = await aiManager.generate(systemPrompt, 'openai', { jsonMode: true });

    let parsedOutput;
    try {
      parsedOutput = JSON.parse(result.text);
      if (!parsedOutput || Object.keys(parsedOutput).length === 0 || (!parsedOutput.content && !parsedOutput.hashtags)) {
        throw new Error('Invalid AI response');
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

    // Save log under social AI module
    await aiHistoryRepository.insertRecord({
      user_id: userId,
      module: 'Social Post Assistant',
      input: body,
      output: parsedOutput,
      tokens_used: result.tokensUsed,
      provider: result.provider,
      is_favorite: false
    }, token);

    return parsedOutput;
  }
}

export const aiService = new AiService();
