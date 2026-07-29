# Changelog

## [1.0.0] - 2026-07-30

### Added

#### Core Platform
- Fastify backend API server with TypeScript
- Astro SSR frontend with React components
- Supabase integration (Auth, Database, Storage)
- File-based JSON database for development
- pnpm monorepo workspace structure

#### Authentication
- Google OAuth via Supabase Auth
- Magic Link passwordless login
- JWT-based session management
- Role-based access control (Free, Pro, Agency, Admin)

#### AI Content Generation (10 Tools)
- Gig Generator - Complete Fiverr gig creation
- Proposal Generator - Freelance proposal writing
- Keyword Finder - SEO keyword research
- Pricing Optimizer - Market-based pricing
- Gig Health Checker - Gig quality scoring
- Portfolio Builder - Portfolio copy generation
- Client Reply - Message response drafting
- Review Analyzer - Sentiment analysis
- SEO Audit - SEO performance scoring
- Social Post Assistant - Social media content

#### AI Providers
- OpenAI (GPT-4o-mini)
- Google Gemini (Gemini 1.5 Flash)
- Anthropic Claude (Claude 3.5 Sonnet)
- Groq (Llama 3.3 70B)
- OpenRouter (multi-model)

#### Social Media Hub
- 6 platform integrations: LinkedIn, Facebook, Instagram, Bluesky, Mastodon, Dev.to
- Post creation and management
- Immediate publishing
- Post scheduling with retry logic
- Campaign management
- Media library
- Social analytics
- AI-powered content generation

#### Analytics
- Dashboard with usage metrics
- Credits tracking
- Words generated counter
- Time saved estimation
- Tool usage breakdowns

#### Billing
- Three-tier plans: Free, Pro, Agency
- Credit-based usage system
- Razorpay payment integration
- Coupon support (LAUNCH20)

#### Storage
- Supabase Storage integration
- File upload (images, PDFs)
- 5 MB file size limit
- Signed URL generation (24-hour expiry)

#### Notifications
- In-app notification system
- Unread count tracking
- Mark all as read

#### Settings
- User profile management
- Notification preferences
- AI provider selection
- Social media settings

#### Infrastructure
- In-process job queue (6 queues)
- Background task processing
- Scheduled post execution
- Daily cleanup jobs
- Analytics aggregation

#### Chrome Extension
- Fiverr content scripts
- Manifest v3 support

#### Testing
- API integration tests
- Social hub tests
- AI package tests
- Auth package tests

#### Documentation
- Developer guide
- Deployment guide
- API documentation
- Architecture documentation
- Environment setup guide

### Security
- Helmet security headers
- CORS origin validation
- Rate limiting (100 req/min)
- JWT token verification
- Input validation (Zod)
- Log redaction (Pino)
- Row Level Security support
- Cookie signing

## [Unreleased]

### Planned
- Cursor-based pagination
- WebSocket real-time updates
- Email notifications (Resend)
- Redis caching layer
- Webhook system
- Admin dashboard
- API key management
- Usage alerts
- Export functionality
- Multi-language support
