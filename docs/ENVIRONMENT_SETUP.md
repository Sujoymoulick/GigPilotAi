# GigPilot AI Environment Variables & Setup Guide

This document lists all environment variables used by the GigPilot AI SaaS backend, their validation rules, and local setup.

## Variable Validation Schema

At startup, the backend validates variables using a strict **Zod** schema. If any mandatory variable is missing or malformed, the process logs an error and exits immediately (`process.exit(1)`).

The validation schema is defined in `apps/backend/src/config/env.ts` as:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().url().default('https://mock.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('mock-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('mock-service-role-key'),
  JWT_SECRET: z.string().default('gigpilot-secret-jwt-key-2026'),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3000,http://localhost:4321,http://127.0.0.1:4321,http://127.0.0.1:3000'),
});
```

---

## Configuration Categories

### 1. Database (Supabase)
- **`SUPABASE_URL`**: The public REST API endpoint of your Supabase project (e.g., `https://abc123xyz.supabase.co`).
- **`SUPABASE_ANON_KEY`**: The client-side anonymous key used by public user clients.
- **`SUPABASE_SERVICE_ROLE_KEY`**: The secret service key used by administrative workers (bypasses RLS policies for background tasks).

### 2. Caching (Upstash Redis)
- **`REDIS_URL`**: Connection endpoint for Upstash. Supports standard TCP URLs (`rediss://...`) or REST URL strings.
- **`REDIS_TOKEN`**: Authorization token required for REST HTTP connections.

### 3. Server Configuration
- **`PORT`**: The local port the Fastify server binds to (default: `3000`).
- **`FRONTEND_URL`**: Comma-separated list of allowed CORS domains. E.g. `http://localhost:4321,https://gigpilot.ai`. Do not use `*` in production!
- **`JWT_SECRET`**: Key used for cookie signatures and mock auth tokens.

---

## Local Setup

1. Copy `.env.example` to create a local environment file in the workspace root:
   ```bash
   cp .env.example .env.local
   ```
2. Populate the keys with your project values.
3. Start the local server:
   ```bash
   npm run dev
   ```
