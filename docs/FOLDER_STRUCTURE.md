# Folder Structure

## Project Root

```
gigpilotai/
├── .agents/                    # Agent skills configuration
├── .astro/                     # Astro generated types
├── .github/workflows/          # CI/CD pipelines
│   └── ci.yml                  # GitHub Actions CI
├── .vscode/                    # VSCode configuration
├── apps/
│   ├── backend/                # Fastify REST API server
│   └── frontend/               # Astro + React SSR frontend
├── docs/                       # This documentation
├── extensions/
│   └── chrome/                 # Chrome browser extension (Fiverr)
├── packages/
│   ├── ai/                     # AI provider abstraction
│   ├── analytics/              # Event tracking analytics
│   ├── auth/                   # Authentication service
│   ├── database/               # Database client
│   ├── shared/                 # Shared TypeScript types
│   └── ui/                     # Shared UI theme tokens
├── public/                     # Root public assets
├── src/                        # Root-level Astro pages (landing)
├── .env.example                # Environment template
├── .env.local                  # Local environment overrides
├── db.json                     # Local JSON database
├── package.json                # Root monorepo config
├── pnpm-workspace.yaml         # Workspace definition
├── render.yaml                 # Render.com deployment
└── tsconfig.json               # Root TypeScript config
```

## Backend (`apps/backend/`)

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts              # Zod-validated env config
│   ├── controllers/
│   │   └── index.ts            # 8 controller classes
│   ├── errors/
│   │   └── AppError.ts         # Custom error hierarchy
│   ├── jobs/
│   │   └── index.ts            # In-process job queues
│   ├── lib/
│   │   └── supabase.ts         # Supabase client factory
│   ├── middleware/
│   │   ├── auth.ts             # JWT auth preHandler
│   │   └── error-handler.ts    # Global error handler
│   ├── repositories/
│   │   ├── BaseRepository.ts   # Abstract CRUD repository
│   │   └── index.ts            # 12 concrete repositories
│   ├── routes/
│   │   └── index.ts            # All route registrations
│   ├── services/
│   │   ├── AiService.ts        # AI generation orchestration
│   │   ├── AnalyticsService.ts # Dashboard aggregation
│   │   ├── AuthService.ts      # JWT verification & sync
│   │   ├── BillingService.ts   # Plan management
│   │   ├── NotificationService.ts # Notifications CRUD
│   │   ├── SettingsService.ts  # User settings
│   │   ├── SocialService.ts    # Social media hub
│   │   └── StorageService.ts   # File upload
│   ├── social/
│   │   └── providers/
│   │       ├── SocialProvider.ts    # Interface
│   │       ├── LinkedInProvider.ts
│   │       ├── FacebookProvider.ts
│   │       ├── InstagramProvider.ts
│   │       ├── BlueskyProvider.ts
│   │       ├── MastodonProvider.ts
│   │       ├── DevtoProvider.ts
│   │       └── index.ts        # Provider factory
│   ├── validators/
│   │   └── index.ts            # Zod validation schemas
│   └── server.ts               # Fastify bootstrap
├── test/
│   ├── api.test.js             # Core API tests
│   └── social.test.js          # Social hub tests
├── package.json
└── tsconfig.json
```

## Frontend (`apps/frontend/`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── BillingManager.tsx
│   │   ├── FavoritesManager.tsx
│   │   ├── HistoryManager.tsx
│   │   ├── SettingsManager.tsx
│   │   ├── TemplatesManager.tsx
│   │   ├── GigGenerator.tsx
│   │   ├── ProposalGenerator.tsx
│   │   ├── KeywordFinder.tsx
│   │   ├── PricingOptimizer.tsx
│   │   ├── GigHealthChecker.tsx
│   │   ├── PortfolioBuilder.tsx
│   │   ├── ClientReply.tsx
│   │   ├── ReviewAnalyzer.tsx
│   │   ├── SeoAuditor.tsx
│   │   ├── PublishAssistant.tsx
│   │   └── social/             # 8 social components
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   └── api-client.ts       # API client with auth
│   └── pages/
│       ├── index.astro         # Landing page
│       ├── login.astro
│       ├── dashboard.astro
│       ├── workspace.astro
│       ├── history.astro
│       ├── favorites.astro
│       ├── templates.astro
│       ├── analytics.astro
│       ├── billing.astro
│       ├── settings.astro
│       ├── auth/
│       │   └── callback.astro  # OAuth callback
│       ├── tools/              # 9 tool pages
│       └── social/             # 8 social pages
├── public/
├── astro.config.mjs
├── tailwind.config.mjs
├── wrangler.toml
├── package.json
└── tsconfig.json
```

## Packages

### `packages/ai/`

```
ai/
├── src/
│   ├── index.ts                # Package entry
│   ├── AIServiceManager.ts     # Provider registry
│   ├── interfaces/
│   │   └── AIService.ts        # Provider interface
│   ├── providers/
│   │   ├── OpenAIProvider.ts
│   │   ├── GeminiProvider.ts
│   │   ├── ClaudeProvider.ts
│   │   ├── GroqProvider.ts
│   │   └── OpenRouterProvider.ts
│   └── prompts/
│       ├── gig.ts
│       ├── proposal.ts
│       ├── keywords.ts
│       ├── pricing.ts
│       ├── review.ts
│       ├── seo.ts
│       ├── health.ts
│       ├── portfolio.ts
│       ├── bio.ts
│       └── faq.ts
└── test/
    └── ai.test.js
```

### `packages/auth/`

```
auth/
├── src/
│   └── index.ts                # AuthService class
└── test/
    └── auth.test.js
```

### `packages/database/`

```
database/
└── src/
    └── index.ts                # DatabaseClient (file-based JSON)
```

### `packages/shared/`

```
shared/
└── src/
    └── index.ts                # All TypeScript interfaces
```

## Chrome Extension (`extensions/chrome/`)

```
chrome/
├── manifest.json               # Manifest v3
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── content/
│   └── fiverr.js               # Fiverr content scripts
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── _locales/
    └── en/
        └── messages.json
```

## Related

- [Architecture](ARCHITECTURE.md)
- [README](README.md)
