# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Web App  │  │ Chrome Ext   │  │ Mobile   │  │ API Client │  │
│  │ (Astro)  │  │ (Manifest v3)│  │ (Future) │  │ (SDK)      │  │
│  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └─────┬──────┘  │
│       │               │               │              │           │
└───────┼───────────────┼───────────────┼──────────────┼───────────┘
        │               │               │              │
        ▼               ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                               │
│              ┌─────────────────────┐                             │
│              │   CDN / Pages       │                             │
│              │  (Static Assets)    │                             │
│              └──────────┬──────────┘                             │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Astro SSR)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Pages   │  │Components│  │  React   │  │Supabase  │       │
│  │  (SSR)   │  │  (24)    │  │ Widgets │  │  Client  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Fastify)                              │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    MIDDLEWARE                             │    │
│  │  Helmet │ CORS │ Rate Limit │ Compress │ Cookie         │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ROUTES (100+)                          │    │
│  │  /api/auth    /api/ai     /api/social   /api/analytics  │    │
│  │  /api/billing /api/storage /api/settings /api/notify    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 AUTH MIDDLEWARE                            │    │
│  │            JWT Verification → req.user                    │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 CONTROLLERS (8)                            │    │
│  │  AuthController      AiController      SocialController  │    │
│  │  AnalyticsController NotificationController               │    │
│  │  BillingController   SettingsController StorageController │    │
│  └──────────────────────────┬──────────────────────────────┘    │
│                              │                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 SERVICES (8)                              │    │
│  │  AuthService      AiService       SocialService          │    │
│  │  AnalyticsService NotificationService BillingService     │    │
│  │  SettingsService   StorageService                        │    │
│  └──────┬──────────────┬──────────────┬────────────────────┘    │
│         │              │              │                          │
│         ▼              ▼              ▼                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │  Auth    │  │   AI     │  │  Social  │                      │
│  │ Package  │  │ Package  │  │ Providers│                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼──────────────┼──────────────┼────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Supabase   │  │  AI Providers │  │   Razorpay   │          │
│  │  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │          │
│  │  │  Auth  │  │  │  │ OpenAI │  │  │  │Payments│  │          │
│  │  ├────────┤  │  │  │ Gemini │  │  │  └────────┘  │          │
│  │  │   DB   │  │  │  │ Claude │  │  └──────────────┘          │
│  │  ├────────┤  │  │  │  Groq  │  │                             │
│  │  │Storage │  │  │  │OpenRtr │  │  ┌──────────────┐          │
│  │  └────────┘  │  │  └────────┘  │  │    Redis     │          │
│  └──────────────┘  └──────────────┘  │   (Upstash)  │          │
│                                       └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Request Lifecycle

```
Client Request
     │
     ▼
┌─────────────┐
│  Fastify    │
│  Server     │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│   Helmet    │───▶│ Security    │
│   (Headers) │    │ Headers     │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│    CORS     │───▶│  Origin     │
│  Check      │    │  Validation │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│ Rate Limit  │───▶│  100 req/min│
│  Check      │    │  per IP     │
└──────┬──────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│   Route     │
│  Handler    │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Auth       │───▶│  JWT        │───▶│  Supabase   │
│ Middleware  │    │  Verify     │    │  getUser()  │
└──────┬──────┘    └─────────────┘    └──────┬──────┘
       │                                      │
       ▼                                      ▼
┌─────────────┐                      ┌─────────────┐
│  Controller │                      │  Attach     │
│  Handler    │◀─────────────────────│  req.user   │
└──────┬──────┘                      └─────────────┘
       │
       ▼
┌─────────────┐
│  Zod        │
│  Validation │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │
│  Layer      │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Repository  │
│  (DB Ops)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐
│  Supabase   │───▶│ PostgreSQL  │
│  Client     │    │    / JSON   │
└─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
│  {success,  │
│   data,     │
│   message}  │
└─────────────┘
```

## Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Supabase │     │ Backend  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  1. OAuth      │                │                │
     │  Initiation    │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │  2. Google     │                │                │
     │  Auth Screen   │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │  3. Callback   │                │                │
     │  with Code     │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │  4. Session    │                │                │
     │  Token         │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │  5. POST /api/auth/login        │                │
     │  (email + Bearer token)         │                │
     │────────────────────────────────▶│                │
     │                │                │                │
     │                │   6. getUser() │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │   7. Verify    │                │
     │                │◀───────────────│                │
     │                │                │                │
     │                │   8. Query/    │                │
     │                │   Upsert User  │                │
     │                │───────────────────────────────▶│
     │                │                │                │
     │                │                │   9. User     │
     │                │                │◀───────────────│
     │                │                │                │
     │  10. Session JWT                │                │
     │◀────────────────────────────────│                │
     │                │                │                │
     │  11. API Calls with Bearer JWT  │                │
     │────────────────────────────────▶│                │
     │                │                │                │
     │                │   12. Verify JWT               │
     │                │───────────────▶│                │
     │                │                │   13. RLS     │
     │                │                │───────────────▶│
     │                │                │                │
```

## AI Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Backend  │     │ AI Mgr   │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  POST /api/    │                │                │
     │  proposal/     │                │                │
     │  generate      │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │  1. Validate   │                │                │
     │  (Zod)         │                │                │
     │                │                │                │
     │  2. Deduct     │                │                │
     │  Credits       │                │                │
     │───────────────────────────────▶│                │
     │                │                │                │
     │  3. Build      │                │                │
     │  Prompt        │                │                │
     │                │                │                │
     │  4. Generate   │                │                │
     │───────────────────────────────▶│                │
     │                │                │                │
     │                │  5. Route to   │                │
     │                │  Provider      │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │                │  6. API Call   │
     │                │                │───────────────▶│
     │                │                │                │
     │                │                │  7. Response   │
     │                │                │◀───────────────│
     │                │                │                │
     │                │  8. Result     │                │
     │                │◀───────────────│                │
     │                │                │                │
     │  9. Parse JSON │                │                │
     │                │                │                │
     │  10. Save to   │                │                │
     │  History       │                │                │
     │───────────────────────────────▶│                │
     │                │                │                │
     │  11. Queue     │                │                │
     │  Analytics Job │                │                │
     │                │                │                │
     │  12. Response  │                │                │
     │◀───────────────│                │                │
```

## Scheduler Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │     │ Backend  │     │  Queue   │     │ Provider │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │  POST /api/    │                │                │
     │  social/       │                │                │
     │  schedule      │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │  1. Create     │                │                │
     │  Post Record   │                │                │
     │                │                │                │
     │  2. Create     │                │                │
     │  Scheduled     │                │                │
     │  Posts         │                │                │
     │                │                │                │
     │  3. Queue with │                │                │
     │  Delay         │                │                │
     │───────────────────────────────▶│                │
     │                │                │                │
     │                │  4. Timer      │                │
     │                │  Fires         │                │
     │                │◀───────────────│                │
     │                │                │                │
     │                │  5. POST /api/ │                │
     │                │  social/       │                │
     │                │  scheduler/run │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │  6. Get Pending│                │
     │                │  Posts         │                │
     │                │                │                │
     │                │  7. Publish    │                │
     │                │  to Provider   │                │
     │                │───────────────────────────────▶│
     │                │                │                │
     │                │  8. Success/   │                │
     │                │  Retry         │                │
     │                │◀───────────────│                │
     │                │                │                │
     │                │  9. Update     │                │
     │                │  Status        │                │
     │                │                │                │
```

## Data Flow

### Dual-Mode Database

The application supports two database modes:

1. **Supabase PostgreSQL** (Production) - When valid Supabase credentials are provided
2. **File-based JSON** (Development/Testing) - Fallback when Supabase URL contains `mock.supabase.co`

The `BaseRepository` class automatically determines which mode to use based on environment configuration.

### Request Envelope

All API responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }
}
```

## Package Structure

```
packages/
├── ai/              # AI provider abstraction
│   ├── src/
│   │   ├── AIServiceManager.ts    # Provider registry & router
│   │   ├── interfaces/            # AIService interface
│   │   ├── providers/             # 5 AI providers
│   │   └── prompts/               # 10 prompt templates
│   └── test/
├── auth/            # Authentication library
│   ├── src/
│   │   └── index.ts               # JWT creation/verification
│   └── test/
├── database/        # Database client
│   └── src/
│       └── index.ts               # File-based JSON DB
├── shared/          # TypeScript types
│   └── src/
│       └── index.ts               # All shared interfaces
└── ui/              # UI theme tokens
```

## Job Queue System

In-process job queue with 6 named queues:

| Queue | Purpose |
|-------|---------|
| `aiGenerationQueue` | AI usage tracking |
| `emailQueue` | Magic link emails |
| `socialPostQueue` | Scheduled post publishing |
| `notificationsQueue` | Push notifications |
| `cleanupQueue` | Daily DB cleanup (24h interval) |
| `analyticsQueue` | Daily API log aggregation |

Jobs support delayed execution (used for post scheduling).

## Social Media Providers

6 platform integrations via a common `SocialProvider` interface:

| Provider | API | Auth Method |
|----------|-----|-------------|
| LinkedIn | API v2 | OAuth 2.0 |
| Facebook | Graph API v19 | OAuth 2.0 |
| Instagram | Graph API (via Facebook) | OAuth 2.0 |
| Bluesky | AT Protocol | App Password |
| Mastodon | REST API | OAuth 2.0 |
| Dev.to | REST API | API Key |

## Security Layers

1. **Helmet** - HTTP security headers (CSP, HSTS, etc.)
2. **CORS** - Origin whitelist from `FRONTEND_URL`
3. **Rate Limiting** - 100 requests/minute per IP
4. **Authentication** - JWT verification on protected routes
5. **Input Validation** - Zod schemas on all endpoints
6. **Error Handler** - Hides stack traces in production
7. **Log Redaction** - Pino redacts auth headers and passwords
8. **RLS** - Supabase Row Level Security via user-scoped clients

## Related

- [Folder Structure](FOLDER_STRUCTURE.md)
- [Database](DATABASE.md)
- [Security](SECURITY.md)
