# API Index

> Master index of all GigPilot AI API endpoints.

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/v1/health` | No | Health check (v1) |

## Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login and sync profile |
| POST | `/api/auth/magic-link` | No | Generate magic link |
| GET | `/api/auth/me` | Yes | Get current user profile |
| POST | `/api/v1/auth/login` | No | Login (v1) |
| POST | `/api/v1/auth/magic-link` | No | Magic link (v1) |
| GET | `/api/v1/auth/me` | Yes | Get profile (v1) |

## AI History & Favorites

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/history` | Yes | Get AI generation history |
| DELETE | `/api/history/:id` | Yes | Delete history record |
| DELETE | `/api/history` | Yes | Clear all history |
| GET | `/api/favorites` | Yes | Get favorited records |
| POST | `/api/favorites/toggle` | Yes | Toggle favorite status |
| GET | `/api/v1/ai/history` | Yes | Get history (v1) |
| DELETE | `/api/v1/ai/history/:id` | Yes | Delete history (v1) |
| DELETE | `/api/v1/ai/history` | Yes | Clear history (v1) |
| GET | `/api/v1/ai/favorites` | Yes | Get favorites (v1) |
| POST | `/api/v1/ai/favorites/toggle` | Yes | Toggle favorite (v1) |

## Proposal Generator

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/proposals` | Yes | List all proposals |
| POST | `/api/proposal/generate` | Yes | Generate proposal (1 credit) |
| PUT | `/api/proposals/:id` | Yes | Update proposal |
| DELETE | `/api/proposals/:id` | Yes | Delete proposal |
| GET | `/api/v1/projects/proposals` | Yes | List proposals (v1) |
| POST | `/api/v1/projects/proposals/generate` | Yes | Generate proposal (v1) |
| DELETE | `/api/v1/projects/proposals/:id` | Yes | Delete proposal (v1) |

## Gig Generator

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gigs` | Yes | List all gigs |
| POST | `/api/gig/generate` | Yes | Generate gig (2 credits) |
| PUT | `/api/gigs/:id` | Yes | Update gig |
| DELETE | `/api/gigs/:id` | Yes | Delete gig |
| GET | `/api/v1/gigs` | Yes | List gigs (v1) |
| POST | `/api/v1/gigs/generate` | Yes | Generate gig (v1) |

## Keyword Finder

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/keywords` | Yes | List keyword results |
| POST | `/api/keywords/find` | Yes | Find keywords (1 credit) |
| DELETE | `/api/keywords/:id` | Yes | Delete keyword result |
| GET | `/api/v1/ai/keywords` | Yes | List keywords (v1) |
| POST | `/api/v1/ai/keywords/find` | Yes | Find keywords (v1) |

## Pricing Optimizer

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/pricing` | Yes | List pricing results |
| POST | `/api/pricing/optimize` | Yes | Optimize pricing (1 credit) |
| GET | `/api/v1/ai/pricing` | Yes | List pricing (v1) |
| POST | `/api/v1/ai/pricing/optimize` | Yes | Optimize pricing (v1) |

## Gig Health Checker

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/gig/health` | Yes | List health checks |
| POST | `/api/gig/health` | Yes | Check gig health (1 credit) |
| GET | `/api/v1/gigs/health` | Yes | List health checks (v1) |
| POST | `/api/v1/gigs/health/check` | Yes | Check health (v1) |

## Portfolio Builder

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/portfolio` | Yes | List portfolio items |
| POST | `/api/portfolio/generate` | Yes | Generate portfolio (2 credits) |
| DELETE | `/api/portfolio/:id` | Yes | Delete portfolio item |
| GET | `/api/v1/ai/portfolio` | Yes | List portfolio (v1) |
| POST | `/api/v1/ai/portfolio/generate` | Yes | Generate portfolio (v1) |

## Client Message Reply

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/messages` | Yes | List message replies |
| POST | `/api/messages/reply` | Yes | Generate reply (1 credit) |
| GET | `/api/v1/ai/messages` | Yes | List messages (v1) |
| POST | `/api/v1/ai/messages/reply` | Yes | Generate reply (v1) |

## Review Analyzer

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews` | Yes | List review analyses |
| POST | `/api/reviews/analyze` | Yes | Analyze reviews (1 credit) |
| GET | `/api/v1/ai/reviews` | Yes | List reviews (v1) |
| POST | `/api/v1/ai/reviews/analyze` | Yes | Analyze reviews (v1) |

## SEO Audit

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/seo` | Yes | List SEO audits |
| POST | `/api/seo/audit` | Yes | Run SEO audit (1 credit) |
| GET | `/api/v1/ai/seo` | Yes | List SEO (v1) |
| POST | `/api/v1/ai/seo/audit` | Yes | Run audit (v1) |

## Social Media Hub

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/social/accounts` | Yes | List connected accounts |
| POST | `/api/social/connect` | Yes | Connect social account |
| POST | `/api/social/disconnect` | Yes | Disconnect account |
| GET | `/api/social/posts` | Yes | List posts |
| POST | `/api/social/posts` | Yes | Create/update post |
| DELETE | `/api/social/posts/:id` | Yes | Delete post |
| POST | `/api/social/publish` | Yes | Publish immediately |
| POST | `/api/social/schedule` | Yes | Schedule post |
| POST | `/api/social/scheduler/run` | No | Run scheduler |
| GET | `/api/social/analytics` | Yes | Get social analytics |
| GET | `/api/social/media` | Yes | List media library |
| POST | `/api/social/media` | Yes | Add media item |
| DELETE | `/api/social/media/:id` | Yes | Delete media item |
| GET | `/api/social/campaigns` | Yes | List campaigns |
| POST | `/api/social/campaigns` | Yes | Create/update campaign |
| DELETE | `/api/social/campaigns/:id` | Yes | Delete campaign |
| GET | `/api/social/settings` | Yes | Get social settings |
| PUT | `/api/social/settings` | Yes | Update social settings |
| POST | `/api/social/ai/generate` | Yes | AI content generation (1 credit) |

All social endpoints have `/api/v1/social/...` equivalents.

## Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics` | Yes | Get dashboard data |
| GET | `/api/v1/analytics` | Yes | Get analytics (v1) |

## Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | Yes | List notifications |
| GET | `/api/notifications/unread` | Yes | Get unread count |
| POST | `/api/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/api/notifications/:id` | Yes | Delete notification |
| GET | `/api/v1/notifications` | Yes | List notifications (v1) |
| GET | `/api/v1/notifications/unread` | Yes | Unread count (v1) |
| POST | `/api/v1/notifications/read-all` | Yes | Mark all read (v1) |
| DELETE | `/api/v1/notifications/:id` | Yes | Delete notification (v1) |

## Billing & Payments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/billing` | Yes | Get billing details |
| POST | `/api/billing/upgrade` | Yes | Upgrade plan |
| GET | `/api/v1/payments/billing` | Yes | Get billing (v1) |
| POST | `/api/v1/payments/upgrade` | Yes | Upgrade plan (v1) |

## Settings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/settings` | Yes | Get settings |
| PUT | `/api/settings` | Yes | Update settings |
| GET | `/api/v1/settings` | Yes | Get settings (v1) |
| PUT | `/api/v1/settings` | Yes | Update settings (v1) |

## Storage

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/storage/upload` | Yes | Upload file |
| POST | `/api/v1/storage/upload` | Yes | Upload file (v1) |

## Gig Drafts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/publish/drafts` | Yes | List drafts |
| POST | `/api/publish/drafts` | Yes | Create draft |
| PUT | `/api/publish/drafts/:id` | Yes | Update draft |

## Templates

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/templates` | Yes | List templates |
| POST | `/api/templates` | Yes | Create template |
| PUT | `/api/templates/:id` | Yes | Update template |
| DELETE | `/api/templates/:id` | Yes | Delete template |

## Statistics

| Category | Endpoints |
|----------|-----------|
| Total Unique Endpoints | ~50 |
| Total with v1 Duplicates | ~100 |
| Auth Required | ~45 |
| No Auth Required | ~5 |

## Related

- [API Reference](API_REFERENCE.md)
- [OpenAPI Spec](OPENAPI.md)
