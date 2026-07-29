# Introduction

## What is GigPilot AI?

GigPilot AI is an AI-powered freelancer toolkit designed to help freelancers on platforms like Fiverr optimize their workflow. It automates content creation, proposal writing, keyword research, pricing analysis, and social media management.

## Core Features

### AI Content Generation
- **Gig Generator** - Create complete Fiverr gig listings with SEO titles, descriptions, packages, FAQs, and tags
- **Proposal Generator** - Write customized freelance proposals for buyer requests
- **Keyword Finder** - Research SEO keywords with search volume and competition metrics
- **Pricing Optimizer** - Get data-driven pricing recommendations based on market analysis
- **Gig Health Checker** - Score and optimize existing gig listings
- **Portfolio Builder** - Generate professional portfolio copy and case studies
- **Client Reply** - Draft professional responses to client messages
- **Review Analyzer** - Analyze review sentiment and extract insights
- **SEO Audit** - Audit gig SEO performance and get optimization tips

### Social Media Hub
- Connect 6 platforms: LinkedIn, Facebook, Instagram, Bluesky, Mastodon, Dev.to
- Create, schedule, and publish posts across platforms
- AI-powered content generation and rewriting
- Campaign management and analytics
- Media library for assets
- Automatic retry logic for failed posts

### Analytics & Insights
- Dashboard with credits usage, words generated, time saved
- Tool usage breakdowns and favorite tool tracking
- 30-day usage history

### Billing & Plans
- Free, Pro, and Agency tiers
- Credit-based usage system
- Razorpay payment integration
- Coupon support (e.g., `LAUNCH20` for 20% off)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Astro 5.x, React 19, Tailwind CSS 3.4 |
| Backend | Fastify 5.x, TypeScript 5.7 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth, Google OAuth, Magic Link |
| AI | OpenAI, Gemini, Claude, Groq, OpenRouter |
| Storage | Supabase Storage (Cloudflare R2) |
| Payments | Razorpay |
| Caching | Upstash Redis |
| Deployment | Render.com (API), Cloudflare Pages (Frontend) |

## Target Audience

- Freelancers on Fiverr, Upwork, and other platforms
- Small agencies managing multiple freelancer accounts
- Social media managers handling freelance brand presence

## Links

- [Quick Start Guide](QUICK_START.md)
- [Architecture](ARCHITECTURE.md)
- [API Index](API_INDEX.md)
