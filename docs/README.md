# GigPilot AI - Documentation

> Official developer documentation for the GigPilot AI platform.

## Overview

GigPilot AI is a comprehensive freelancer toolkit powered by artificial intelligence. It provides gig generation, proposal writing, keyword research, pricing optimization, social media management, and more.

## Documentation Structure

| Document | Description |
|----------|-------------|
| [Introduction](INTRODUCTION.md) | Platform overview and capabilities |
| [Quick Start](QUICK_START.md) | Getting started guide |
| [Authentication](AUTHENTICATION.md) | Auth flow and JWT management |
| [Architecture](ARCHITECTURE.md) | System architecture and design |
| [Folder Structure](FOLDER_STRUCTURE.md) | Project directory layout |
| [Database](DATABASE.md) | Database schema and tables |
| [Supabase](SUPABASE.md) | Supabase integration details |
| [Storage](STORAGE.md) | File storage system |
| [Error Handling](ERROR_HANDLING.md) | Error codes and handling |
| [Rate Limits](RATE_LIMITS.md) | Rate limiting configuration |
| [Pagination](PAGINATION.md) | Pagination patterns |
| [Security](SECURITY.md) | Security practices and audit |
| [Changelog](CHANGELOG.md) | Version history |

## API Documentation

| Document | Description |
|----------|-------------|
| [API Index](API_INDEX.md) | Master endpoint index |
| [API Reference](API_REFERENCE.md) | Response format and conventions |
| [OpenAPI Spec](OPENAPI.md) | OpenAPI 3.0 specification |
| [Webhooks](WEBHOOKS.md) | Webhook documentation |
| [SDK Examples](SDK_EXAMPLES.md) | Client SDK examples |

### Endpoint Groups

| Document | Description |
|----------|-------------|
| [Auth API](api/auth.md) | Authentication endpoints |
| [Users API](api/users.md) | User management endpoints |
| [AI API](api/ai.md) | AI generation endpoints |
| [Gigs API](api/gigs.md) | Gig management endpoints |
| [Projects API](api/projects.md) | Project endpoints |
| [Social API](api/social.md) | Social media hub endpoints |
| [Analytics API](api/analytics.md) | Analytics dashboard |
| [Notifications API](api/notifications.md) | Notification system |
| [Storage API](api/storage.md) | File upload endpoints |
| [Payments API](api/payments.md) | Billing and payments |
| [Settings API](api/settings.md) | User settings |
| [Admin API](api/admin.md) | Admin endpoints |
| [Scheduler API](api/scheduler.md) | Post scheduler |
| [Health API](api/health.md) | Health check endpoints |

## Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.gigpilot.ai` |
| Development | `http://localhost:3000` |

## API Versioning

All endpoints are available under both `/api/` and `/api/v1/` prefixes. Both versions are identical and point to the same handlers.

## Support

- GitHub Issues: https://github.com/anomalyco/gigpilotai/issues
