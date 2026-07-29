# Security

## Overview

GigPilot AI implements multiple security layers to protect user data and prevent unauthorized access.

## Security Layers

### 1. HTTP Security Headers (Helmet)

Automatically adds security headers to all responses:

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Restricts resource loading |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000` |
| `X-XSS-Protection` | `1; mode=block` |

### 2. CORS Configuration

Only allows requests from configured origins:

```typescript
FRONTEND_URL=http://localhost:3000,http://localhost:4321
```

- Credentials are allowed (`credentials: true`)
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Requests with no origin (mobile apps, curl) are allowed

### 3. Rate Limiting

- **100 requests per minute** per IP address
- Prevents brute-force and DDoS attacks
- Returns `429 Too Many Requests` when exceeded

### 4. Authentication

- JWT-based authentication via Supabase Auth
- Tokens verified against Supabase before use
- Protected routes require valid `Authorization: Bearer <token>` header
- Session expiry: 7 days

### 5. Input Validation

All request bodies validated with Zod schemas:

```typescript
// Example: Login validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  fullName: z.string().optional(),
});
```

Invalid input returns `400 Bad Request` with field-level error details.

### 6. Error Handling

- Stack traces hidden in production mode
- Generic error messages for 500 errors
- Detailed errors only in development

### 7. Log Redaction

Pino logger automatically redacts sensitive fields:

```typescript
logger: {
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.password',
      'req.body.data'
    ],
    censor: '[REDACTED]'
  }
}
```

### 8. Row Level Security (RLS)

Supabase RLS ensures users can only access their own data:

- User-scoped Supabase clients include JWT token
- RLS policies filter queries by `user_id`
- Admin client (service role) bypasses RLS for background jobs

### 9. Cookie Security

Cookies signed with `JWT_SECRET`:

```typescript
await fastify.register(cookie, { secret: env.JWT_SECRET });
```

## Sensitive Data Handling

### Never Exposed in Responses

- Passwords
- API keys
- JWT secrets
- Database credentials
- Service role keys
- OAuth client secrets
- Refresh tokens (in logs)

### Redacted in Logs

- `Authorization` header
- Request body `password` field
- Request body `data` field (file uploads)

### Environment Variables

All secrets stored in `.env.local` (gitignored). Never committed to repository.

## Security Audit

### Findings

| File | Line | Type | Severity | Status |
|------|------|------|----------|--------|
| `packages/auth/src/index.ts` | 16 | JWT Secret Default | Medium | DEFAULT USED IN DEV |
| `apps/backend/src/config/env.ts` | 16 | JWT Secret Default | Medium | DEFAULT USED IN DEV |

> **Note:** Default JWT secrets (`gigpilot-secret-jwt-key-2026`) are used when environment variables are not set. These are for development only and must be overridden in production.

### Recommendations

1. **Rotate JWT secrets** regularly in production
2. **Enable Supabase RLS** policies for all tables
3. **Use HTTPS** in production (enforced by Cloudflare)
4. **Monitor rate limit** hits for potential attacks
5. **Audit API keys** regularly and rotate if compromised
6. **Enable 2FA** for Supabase dashboard access
7. **Review CORS origins** before deploying to production

## Threat Model

| Threat | Mitigation |
|--------|-----------|
| Brute-force login | Rate limiting (100 req/min) |
| XSS | Helmet CSP headers, input validation |
| CSRF | CORS origin validation, SameSite cookies |
| SQL Injection | Supabase parameterized queries |
| Token theft | HTTPS, short-lived tokens, session expiry |
| Data leakage | RLS policies, log redaction |
| DDoS | Rate limiting, Cloudflare CDN |
| Man-in-the-middle | HTTPS enforcement |

## Related

- [Authentication](AUTHENTICATION.md)
- [Rate Limits](RATE_LIMITS.md)
- [Error Handling](ERROR_HANDLING.md)
