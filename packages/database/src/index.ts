import type { UserProfile, GenerationRecord, TemplateRecord } from '@gigpilot/shared';

// Dynamic fs imports for Node/Workers environment safety
let fs: any = null;
let path: any = null;
try {
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    fs = await import('node:fs');
    path = await import('node:path');
  }
} catch (e) {
  // Edge runtime fallback
}

export interface DatabaseClientConfig {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export class DatabaseClient {
  private url: string;
  private key: string;
  private memoryDb: any = null;
  private dbPath: string = '';

  constructor(config?: DatabaseClientConfig) {
    this.url = config?.supabaseUrl || process.env.SUPABASE_URL || 'https://mock.supabase.co';
    this.key = config?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || 'mock-key';
    
    if (path) {
      // Resolve path to database packages directory
      this.dbPath = path.resolve(process.cwd(), '../../db.json');
      // If running from root directory directly
      if (!fs.existsSync(this.dbPath)) {
        this.dbPath = path.resolve(process.cwd(), './db.json');
      }
    }
    
    this.loadDb();
  }

  private loadDb() {
    if (fs && this.dbPath) {
      try {
        if (fs.existsSync(this.dbPath)) {
          const raw = fs.readFileSync(this.dbPath, 'utf-8');
          this.memoryDb = JSON.parse(raw);
          
          // Self-healing database upgrade
          let dirty = false;
          const seed = this.getSeedData();
          const newKeys = ['social_accounts', 'posts', 'scheduled_posts', 'media_library', 'campaigns', 'social_analytics'];
          for (const key of newKeys) {
            if (!this.memoryDb[key]) {
              this.memoryDb[key] = (seed as any)[key] || [];
              dirty = true;
            }
          }
          if (dirty) {
            this.saveDb();
          }
          return;
        }
      } catch (err) {
        console.warn('Failed to read db.json, falling back to memory seed', err);
      }
    }

    // Seed database if not existing or in-memory fallback
    this.memoryDb = this.getSeedData();
    this.saveDb();
  }

  private saveDb() {
    if (fs && this.dbPath && this.memoryDb) {
      try {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
      } catch (err) {
        console.warn('Failed to write db.json', err);
      }
    }
  }

  public getClientInfo() {
    return { url: this.url, connected: true, fileStorage: !!fs, path: this.dbPath };
  }

  // --- Core CRUD API ---
  public getCollection(table: string): any[] {
    this.loadDb(); // Ensure fresh load
    if (!this.memoryDb[table]) {
      this.memoryDb[table] = [];
    }
    // Return records that are not soft-deleted
    return this.memoryDb[table].filter((item: any) => !item.soft_delete && !item.softDelete);
  }

  public getById(table: string, id: string): any | null {
    const list = this.getCollection(table);
    return list.find((item) => item.id === id) || null;
  }

  public insert(table: string, item: any): any {
    this.loadDb();
    if (!this.memoryDb[table]) {
      this.memoryDb[table] = [];
    }
    const newItem = {
      id: item.id || `id_${table}_${Math.random().toString(36).substring(2, 11)}`,
      user_id: item.user_id || 'usr_fiverr_pro_001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item
    };
    this.memoryDb[table].push(newItem);
    this.saveDb();
    return newItem;
  }

  public update(table: string, id: string, updates: any): any | null {
    this.loadDb();
    if (!this.memoryDb[table]) return null;
    const index = this.memoryDb[table].findIndex((item: any) => item.id === id);
    if (index === -1) return null;

    // Support Version History
    const originalItem = this.memoryDb[table][index];
    const versions = originalItem.versions || [];
    const newVersion = {
      version: versions.length + 1,
      updated_at: originalItem.updated_at || originalItem.created_at || new Date().toISOString(),
      payload: { ...originalItem, versions: undefined }
    };

    const updatedItem = {
      ...originalItem,
      ...updates,
      updated_at: new Date().toISOString(),
      versions: [...versions, newVersion]
    };

    this.memoryDb[table][index] = updatedItem;
    this.saveDb();
    return updatedItem;
  }

  public delete(table: string, id: string, soft: boolean = true): boolean {
    this.loadDb();
    if (!this.memoryDb[table]) return false;
    const index = this.memoryDb[table].findIndex((item: any) => item.id === id);
    if (index === -1) return false;

    if (soft) {
      this.memoryDb[table][index].soft_delete = true;
      this.memoryDb[table][index].softDelete = true;
      this.memoryDb[table][index].deleted_at = new Date().toISOString();
    } else {
      this.memoryDb[table].splice(index, 1);
    }
    
    this.saveDb();
    return true;
  }

  // Helper to query analytics and credits remaining for users
  public deductCredits(userId: string, count: number = 1): number {
    const user = this.getById('users', userId);
    if (user) {
      const remaining = Math.max(0, user.credits_remaining - count);
      this.update('users', userId, { credits_remaining: remaining });
      return remaining;
    }
    return 0;
  }

  // --- Seed Data Provider ---
  private getSeedData() {
    const now = new Date();
    
    // Generate daily usage logs for analytics charts (past 30 days)
    const analyticsLogs: any[] = [];
    const toolNames = ['Proposal Generator', 'Keyword Finder', 'Pricing Optimizer', 'Gig Health Checker', 'Portfolio Builder', 'Client Messages', 'Review Analyzer', 'SEO Audit', 'Publish Assistant'];
    
    for (let i = 29; i >= 0; i--) {
      const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = logDate.toISOString().split('T')[0];
      
      // Credits used on this day
      const creditsUsed = Math.floor(Math.random() * 8) + 1;
      const wordsGenerated = creditsUsed * (Math.floor(Math.random() * 400) + 600);
      const timeSavedMinutes = creditsUsed * 15;
      
      analyticsLogs.push({
        id: `log_${i}`,
        date: dateStr,
        day: dayName,
        creditsUsed,
        wordsGenerated,
        timeSavedMinutes,
        toolUsage: toolNames.map(name => ({
          tool: name,
          count: Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0
        }))
      });
    }

    return {
      users: [
        {
          id: 'usr_fiverr_pro_001',
          email: 'alex@gigpilot.ai',
          full_name: 'Alex Vance',
          fullName: 'Alex Vance',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          role: 'Pro',
          credits_remaining: 450,
          creditsRemaining: 450,
          monthly_quota: 500,
          monthlyQuota: 500,
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }
      ],
      subscriptions: [
        {
          id: 'sub_001',
          user_id: 'usr_fiverr_pro_001',
          plan: 'Pro',
          status: 'active',
          razorpay_subscription_id: 'sub_prod_12891391',
          current_period_start: now.toISOString(),
          current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: now.toISOString()
        }
      ],
      templates: [
        {
          id: 'tmpl_01',
          user_id: 'usr_fiverr_pro_001',
          title: 'Premium Next.js Web Development description',
          category: 'Programming & Tech',
          type: 'gig',
          content: 'Are you looking to build a blazing-fast, SEO-optimized website? I specialize in React, Next.js, and Tailwind CSS templates...',
          is_custom: false,
          isCustom: false,
          is_favorite: true,
          isFavorite: true,
          created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'tmpl_02',
          user_id: 'usr_fiverr_pro_001',
          title: 'Winning Custom Proposal for Figma Rebrand',
          category: 'Graphics & Design',
          type: 'proposal',
          content: 'Hi [Buyer Name], I saw your request for a modern brand overhaul. I have designed logos and complete kits for 50+ startups...',
          is_custom: true,
          isCustom: true,
          is_favorite: true,
          isFavorite: true,
          created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'tmpl_03',
          user_id: 'usr_fiverr_pro_001',
          title: 'Out of Office - Project Delivery Message',
          category: 'Client Messages',
          type: 'reply',
          content: 'Hi there, thank you for placing the order. I have started working on your requirements and will keep you posted with updates!',
          is_custom: false,
          isCustom: false,
          is_favorite: false,
          isFavorite: false,
          created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      generations: [
        {
          id: 'gen_001',
          user_id: 'usr_fiverr_pro_001',
          module: 'Proposal Generator',
          input: {
            type: 'buyer_request',
            buyerName: 'David K.',
            jobDescription: 'Need a developer to convert my landing page mockup into a fully operational Next.js site.',
            myService: 'Full-stack Web Developer specialized in Next.js, React and CSS',
            tone: 'Professional & Assertive',
            pricingEstimate: '$300',
            deliveryTime: '3 Days'
          },
          output: {
            subjectLine: 'Convert Landing Page mockup to Next.js in 3 days',
            proposalText: `Hi David K.,\n\nI reviewed your request to convert your landing page mockup into a high-performance Next.js site. I specialize in exact PSD/Figma-to-code conversions using modular React structures and pixel-perfect styling.\n\nWhy me:\n- 100% Responsive layout\n- SEO optimized metadata\n- Blazing fast performance (95+ page speed score)\n\nI can deliver this within 3 days for $300. Let's discuss details in chat!\n\nBest,\nAlex`,
            keyHighlights: ['Figma-to-Next.js exact match', 'Lighthouse PageSpeed 95+', 'Fully interactive components'],
            suggestedQuestions: ['Can you share the link to your current mockups/Figma design?'],
            callToAction: 'Send me a message in chat to get started!'
          },
          tokens_used: 480,
          provider: 'Gemini',
          is_favorite: true,
          isFavorite: true,
          created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
        },
        {
          id: 'gen_002',
          user_id: 'usr_fiverr_pro_001',
          module: 'Keyword Finder',
          input: {
            service: 'Logo Design'
          },
          output: {
            primaryKeywords: [
              { keyword: 'logo designer', type: 'primary', estimatedSearchVolume: 45000, competitionLevel: 'High', difficultyScore: 82, opportunityScore: 68, trend: 'Stable', intent: 'Transactional' },
              { keyword: 'professional logo design', type: 'primary', estimatedSearchVolume: 12500, competitionLevel: 'High', difficultyScore: 74, opportunityScore: 55, trend: 'Rising', intent: 'Transactional' }
            ],
            longTailKeywords: [
              { keyword: 'minimalist business logo', type: 'long-tail', estimatedSearchVolume: 8500, competitionLevel: 'Medium', difficultyScore: 42, opportunityScore: 88, trend: 'Rising', intent: 'Transactional' },
              { keyword: 'tech startup branding logo design', type: 'long-tail', estimatedSearchVolume: 2400, competitionLevel: 'Low', difficultyScore: 18, opportunityScore: 95, trend: 'Rising', intent: 'Transactional' }
            ],
            relatedSearches: [
              { keyword: 'modern minimalist logo design', type: 'related', estimatedSearchVolume: 15400, competitionLevel: 'Medium', difficultyScore: 48, opportunityScore: 82, trend: 'Stable', intent: 'Commercial' }
            ],
            competitorKeywords: [
              { keyword: 'vector brand identity logo', type: 'competitor', estimatedSearchVolume: 6700, competitionLevel: 'Medium', difficultyScore: 35, opportunityScore: 79, trend: 'Stable', intent: 'Commercial' }
            ],
            summary: {
              avgDifficulty: 49,
              avgOpportunity: 77,
              recommendedFocus: ['Target long-tail keywords in your Fiverr tags', 'Optimize description with "minimalist business logo"']
            }
          },
          tokens_used: 620,
          provider: 'OpenAI',
          is_favorite: false,
          isFavorite: false,
          created_at: new Date(now.getTime() - 5 * 3600 * 1000).toISOString()
        }
      ],
      favorites: [
        {
          id: 'fav_01',
          user_id: 'usr_fiverr_pro_001',
          item_type: 'template',
          target_id: 'tmpl_01',
          payload: {
            title: 'Premium Next.js Web Development description',
            type: 'gig',
            content: 'Are you looking to build a blazing-fast, SEO-optimized website? I specialize in React, Next.js, and Tailwind CSS templates...'
          },
          created_at: now.toISOString()
        }
      ],
      settings: [
        {
          id: 'set_001',
          user_id: 'usr_fiverr_pro_001',
          default_provider: 'gemini',
          default_tone: 'Professional',
          email_notifications: true,
          dark_mode: true,
          updated_at: now.toISOString()
        }
      ],
      history: [
        {
          id: 'hist_01',
          user_id: 'usr_fiverr_pro_001',
          action: 'AI Proposal Generation',
          details: { client: 'David K.', type: 'buyer_request' },
          created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
        },
        {
          id: 'hist_02',
          user_id: 'usr_fiverr_pro_001',
          action: 'AI Keyword Search',
          details: { query: 'Logo Design' },
          created_at: new Date(now.getTime() - 5 * 3600 * 1000).toISOString()
        }
      ],
      billing: [
        {
          id: 'bill_inv_001',
          user_id: 'usr_fiverr_pro_001',
          invoice_id: 'INV-2026-0728',
          amount: 29.00,
          currency: 'USD',
          status: 'Paid',
          pdf_url: '#',
          created_at: new Date(now.getTime() - 3600 * 1000).toISOString()
        }
      ],
      analytics: analyticsLogs,
      gigs: [
        {
          id: 'gig_draft_01',
          user_id: 'usr_fiverr_pro_001',
          title: 'I will build high converting Next js website and Tailwind CSS application',
          category: 'Programming & Tech',
          content: {
            seoTitle: 'I will build high converting Next js website and Tailwind CSS application',
            description: 'Looking for a custom site? I will build optimized frontend pages using React, Next.js, and Tailwind CSS.\n\nWhat is included:\n- Clean modular code\n- Fully responsive layout\n- SEO-optimized tags and speed settings',
            packages: {
              basic: { name: 'Basic Starter', title: 'Single Page Setup', description: 'Core Layout built in Next.js', deliveryDays: 2, revisions: '2 Revisions', price: 45, features: ['1 Page', 'Tailwind integration', 'Source Code'] },
              standard: { name: 'Standard Pro', title: 'Complete Web App', description: 'Up to 5 Pages with API link', deliveryDays: 4, revisions: '5 Revisions', price: 95, features: ['Everything in Basic', 'API integration', 'Custom design'] },
              premium: { name: 'Premium Empire', title: 'Enterprise Portal', description: 'Full application with admin setup', deliveryDays: 7, revisions: 'Unlimited', price: 250, features: ['Everything in Standard', 'Supabase integration', 'Multi-role layout'] }
            },
            faqs: [
              { question: 'Do you design or just write code?', answer: 'I specialize in both custom Tailwind layout design and clean Next.js coding.' }
            ],
            requirements: ['Brand preferred style guidelines', 'Wireframes / references'],
            tags: ['nextjs', 'tailwindcss', 'web-development', 'react', 'api-integration'],
            callToAction: 'Order today to unlock elite performance!',
            imagePrompt: 'Isometric 3D workspace graphic showing purple neon grids and code screens for gig thumbnail.',
            videoScript: '[Intro 0:00-0:05] Fast websites sell. I build Next.js apps...',
            upsellSuggestions: ['Fast 24-hr express (+$30)']
          },
          status: 'draft',
          created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
        }
      ],
      portfolios: [],
      social_accounts: [
        {
          id: 'acc_li_001',
          user_id: 'usr_fiverr_pro_001',
          provider: 'linkedin',
          provider_user_id: 'li_usr_998273',
          username: 'alexvance_linkedin',
          display_name: 'Alex Vance',
          email: 'alex@gigpilot.ai',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          access_token: 'mock_linkedin_token_alex',
          refresh_token: 'mock_linkedin_refresh_alex',
          expires_at: new Date(now.getTime() + 60 * 24 * 3600 * 1000).toISOString(),
          scope: 'w_member_social r_liteprofile r_emailaddress',
          status: 'connected',
          last_sync: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
          created_at: new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
        },
        {
          id: 'acc_ma_001',
          user_id: 'usr_fiverr_pro_001',
          provider: 'mastodon',
          provider_user_id: 'mast_usr_998182',
          username: 'alexvance_mastodon',
          display_name: 'Alex Vance',
          email: 'mastodon@gigpilot.ai',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          access_token: 'mock_mastodon_token_alex',
          refresh_token: '',
          expires_at: '',
          scope: 'read write follow instance:mastodon.social',
          status: 'connected',
          last_sync: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
          created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 3 * 3600 * 1000).toISOString()
        },
        {
          id: 'acc_dev_001',
          user_id: 'usr_fiverr_pro_001',
          provider: 'dev.to',
          provider_user_id: 'devto_acc_100201',
          username: 'gigpilot_devto',
          display_name: 'GigPilot AI Author',
          email: 'devto@gigpilot.ai',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
          access_token: 'mock_devto_key_alex',
          refresh_token: '',
          expires_at: '',
          scope: 'api-key',
          status: 'connected',
          last_sync: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
          created_at: new Date(now.getTime() - 8 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString()
        }
      ],
      posts: [
        {
          id: 'post_001',
          user_id: 'usr_fiverr_pro_001',
          title: 'Unlocking 10x Productivity with Next.js & GigPilot',
          content: 'Just shared my secret sauce for NextJS styling and landing page optimization. Building modular frontends has never been faster when backed by structured prompt engineering and Tailwind UI blocks. Read full guide here!',
          hashtags: 'nextjs,webdev,freelancer,ai',
          mentions: 'gigpilot_ai',
          link: 'https://gigpilot.ai/blog/productivity-nextjs',
          status: 'Published',
          created_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'post_002',
          user_id: 'usr_fiverr_pro_001',
          title: 'AI-powered Social Scheduler is Here',
          content: 'I am excited to share the release of our new Social Media Hub! Seamlessly connect your channels, write with AI assistance, and schedule posts directly from your workspace dashboard.',
          hashtags: 'ai,marketing,productivity,saas',
          mentions: '',
          link: 'https://gigpilot.ai/social-hub',
          status: 'Scheduled',
          created_at: new Date(now.getTime() - 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 3600 * 1000).toISOString()
        },
        {
          id: 'post_003',
          user_id: 'usr_fiverr_pro_001',
          title: 'Fiverr Freelancing Hacks for 2026',
          content: 'Drafting my next gig. To rank high in Fiverr searches, always research long-tail tags, write clear packages, and perform keyword analysis. Here is how I use AI keywords data...',
          hashtags: 'fiverr,gigeconomy,sidehustle',
          mentions: '',
          link: '',
          status: 'Draft',
          created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString()
        }
      ],
      scheduled_posts: [
        {
          id: 'sched_001',
          user_id: 'usr_fiverr_pro_001',
          post_id: 'post_002',
          provider: 'linkedin',
          scheduled_time: new Date(now.getTime() + 18 * 3600 * 1000).toISOString(),
          timezone: 'UTC',
          status: 'Scheduled',
          retry_count: 0,
          published_at: null,
          error_message: null,
          created_at: new Date(now.getTime() - 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 3600 * 1000).toISOString()
        },
        {
          id: 'sched_002',
          user_id: 'usr_fiverr_pro_001',
          post_id: 'post_002',
          provider: 'mastodon',
          scheduled_time: new Date(now.getTime() + 18 * 3600 * 1000).toISOString(),
          timezone: 'UTC',
          status: 'Scheduled',
          retry_count: 0,
          published_at: null,
          error_message: null,
          created_at: new Date(now.getTime() - 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 3600 * 1000).toISOString()
        }
      ],
      media_library: [
        {
          id: 'med_001',
          user_id: 'usr_fiverr_pro_001',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          filename: 'workspace_setup.jpg',
          size: 245310,
          created_at: new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'med_002',
          user_id: 'usr_fiverr_pro_001',
          type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
          filename: 'analytics_charts.jpg',
          size: 182400,
          created_at: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'med_003',
          user_id: 'usr_fiverr_pro_001',
          type: 'application/pdf',
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          filename: 'freelance_strategy.pdf',
          size: 104523,
          created_at: new Date(now.getTime() - 1 * 24 * 3600 * 1000).toISOString()
        }
      ],
      campaigns: [
        {
          id: 'camp_001',
          user_id: 'usr_fiverr_pro_001',
          name: 'Launch Promo Q3',
          description: 'Promotional postings and outreach campaign for GigPilot Social Hub release.',
          color: '#10B981',
          start_date: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
          end_date: new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
          budget: 500,
          goal: 'Get 1,000 trial sign-ups',
          status: 'Active',
          created_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString(),
          updated_at: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString()
        },
        {
          id: 'camp_002',
          user_id: 'usr_fiverr_pro_001',
          name: 'Fiverr Success Tips',
          description: 'Weekly tutorials sharing gig setup tips and branding guides.',
          color: '#8B5CF6',
          start_date: new Date(now.getTime()).toISOString().split('T')[0],
          end_date: new Date(now.getTime() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
          budget: 200,
          goal: 'Increase profile engagement',
          status: 'Active',
          created_at: now.toISOString(),
          updated_at: now.toISOString()
        }
      ],
      social_analytics: (() => {
        const socialAnalyticsLogs: any[] = [];
        const socialProviders = ['linkedin', 'facebook', 'instagram', 'bluesky', 'mastodon', 'dev.to'];
        for (let i = 29; i >= 0; i--) {
          const logDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = logDate.toISOString().split('T')[0];
          
          socialProviders.forEach(provider => {
            const isConnected = ['linkedin', 'mastodon', 'dev.to'].includes(provider);
            const mult = isConnected ? 1.5 : 0.8;
            const followers = Math.floor((1200 + (30 - i) * 12) * mult);
            const postsCount = Math.floor((5 + (30 - i) * 0.5) * mult);
            const likes = Math.floor((200 + (30 - i) * 5) * mult);
            const clicks = Math.floor((80 + (30 - i) * 3) * mult);
            const engagement = Math.round((likes * 1.5 + clicks * 2) * 100) / 100;
            
            socialAnalyticsLogs.push({
              id: `soc_an_${provider}_${i}`,
              user_id: 'usr_fiverr_pro_001',
              provider,
              followers,
              posts: postsCount,
              engagement,
              clicks,
              likes,
              shares: Math.floor(likes * 0.2),
              comments: Math.floor(likes * 0.15),
              date: dateStr
            });
          });
        }
        return socialAnalyticsLogs;
      })()
    };
  }
}

export const dbClient = new DatabaseClient();
