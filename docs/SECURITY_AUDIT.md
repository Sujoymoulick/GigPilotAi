# Security Audit Report

> Generated: July 30, 2026
> Scope: Full codebase scan

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 5 |
| Low | 3 |
| **Total** | **14** |

## Critical Findings

### 1. Supabase Service Role Key in .env.local

| Field | Value |
|-------|-------|
| File | `.env.local` |
| Line | 4 |
| Type | Supabase Service Role Key |
| Severity | Critical |
| Git Tracked | No (excluded by .gitignore) |
| Status | REDACTED |

The service role key bypasses Row Level Security (RLS) and grants full admin access to the Supabase database.

---

### 2. Supabase Anon Key in wrangler.toml (COMMITTED TO GIT)

| Field | Value |
|-------|-------|
| File | `apps/frontend/wrangler.toml` |
| Lines | 7-10 |
| Type | Supabase URL and Anon Key |
| Severity | Critical |
| Git Tracked | **YES** |
| Status | REDACTED |

The wrangler.toml is tracked in git and contains real Supabase credentials. This reveals the exact Supabase project ID.

**Remediation:** Add `wrangler.toml` to `.gitignore` or move all `[vars]` values to Cloudflare Pages environment variables.

## High Findings

### 3. Hardcoded JWT Secret Default

| Field | Value |
|-------|-------|
| File | `apps/backend/src/config/env.ts` |
| Line | 16 |
| Type | JWT Secret (default fallback) |
| Severity | High |
| Git Tracked | YES |
| Status | DEFAULT USED IN DEV |

Also present in:
- `packages/auth/src/index.ts` (line 16)
- `.env.example` (line 16)

If `JWT_SECRET` is not set, this weak, predictable fallback is used for signing/verifying all JWT tokens.

**Remediation:** Replace with a randomly generated value or require it to be set with no default.

---

### 4. Real Resend API Key in .env.local

| Field | Value |
|-------|-------|
| File | `.env.local` |
| Line | 28 |
| Type | Resend API Key |
| Severity | High |
| Git Tracked | No |
| Status | REDACTED |

Grants ability to send emails from configured domains.

---

### 5. Supabase Project URL Exposed

| Field | Value |
|-------|-------|
| File | `apps/frontend/wrangler.toml` |
| Lines | 7, 9 |
| Type | Supabase Project URL |
| Severity | High |
| Git Tracked | YES |
| Status | REDACTED |

Reveals the exact Supabase project ID, enabling targeted attacks.

---

### 6. Supabase Anon Key in wrangler.toml

| Field | Value |
|-------|-------|
| File | `apps/frontend/wrangler.toml` |
| Lines | 7-10 |
| Type | Supabase Anon Key |
| Severity | High |
| Git Tracked | YES |
| Status | REDACTED |

## Medium Findings

### 7. Hardcoded Default Keys in Auth Package

| Field | Value |
|-------|-------|
| File | `packages/auth/src/index.ts` |
| Lines | 16-18 |
| Type | JWT Secret and Supabase Key defaults |
| Severity | Medium |
| Git Tracked | YES |
| Status | PLACEHOLDER |

### 8. Hardcoded Default Keys in Backend Config

| Field | Value |
|-------|-------|
| File | `apps/backend/src/config/env.ts` |
| Lines | 13-15 |
| Type | Supabase URL, Anon Key, Service Role Key defaults |
| Severity | Medium |
| Git Tracked | YES |
| Status | PLACEHOLDER |

### 9. Weak Test Passwords

| Field | Value |
|-------|-------|
| File | `apps/backend/test/social.test.js` |
| Line | 13 |
| File | `apps/backend/test/api.test.js` |
| Line | 21 |
| Type | Test password |
| Severity | Medium |
| Git Tracked | YES |
| Status | TEST VALUE |

### 10. .env.example Contains Weak JWT Secret

| Field | Value |
|-------|-------|
| File | `.env.example` |
| Line | 16 |
| Type | JWT Secret in example config |
| Severity | Medium |
| Git Tracked | YES |
| Status | EXAMPLE VALUE |

### 11. Supabase Key in DOM Data Attribute

| Field | Value |
|-------|-------|
| File | `apps/frontend/src/pages/auth/callback.astro` |
| Line | 6 |
| Type | Supabase Anon Key (via env var) |
| Severity | Medium |
| Git Tracked | YES |
| Status | ENV VAR (visible in DevTools) |

## Low Findings

### 12. API URL in Client Code

| Field | Value |
|-------|-------|
| File | `apps/frontend/src/lib/api-client.ts` |
| Line | 9 |
| Type | Backend API URL |
| Severity | Low |
| Status | EXPECTED |

### 13. Google OAuth Client ID Placeholder

| Field | Value |
|-------|-------|
| File | `packages/auth/src/index.ts` |
| Line | 71 |
| Type | Google OAuth Client ID |
| Severity | Low |
| Status | PLACEHOLDER |

### 14. Mock Social Media Tokens

| Field | Value |
|-------|-------|
| File | Multiple social provider files |
| Type | Mock access tokens |
| Severity | Low |
| Status | MOCK VALUE |

## Positive Findings

- No hardcoded AWS keys or secret keys
- No SSH private keys or certificates
- No hardcoded Stripe/PayPal payment secrets
- No hardcoded SendGrid/Mailgun/Twilio tokens
- No hardcoded Firebase/Azure/GCloud credentials
- No hardcoded Redis passwords in source code
- `.env.local` and `apps/frontend/.env` properly excluded by `.gitignore`
- `render.yaml` uses `sync: false` with placeholders
- Backend uses log redaction for sensitive request fields

## Recommended Remediation

| Priority | Action |
|----------|--------|
| **Immediate** | Rotate all exposed secrets in Supabase dashboard and Resend |
| **Immediate** | Add `wrangler.toml` to `.gitignore` or use Cloudflare env vars |
| **Immediate** | Replace hardcoded JWT secret with random value or require env var |
| **High** | Update `.env.example` with placeholder JWT secret |
| **High** | Remove default Supabase keys from env.ts and auth/index.ts |
| **Medium** | Run `git filter-repo` to remove wrangler.toml from git history |
| **Medium** | Replace test passwords with env-var-loaded values |
| **Low** | Add pre-commit hook with gitleaks or trufflehog |

## File Inventory

| File | Git Tracked | Contains Real Secrets |
|------|------------|----------------------|
| `.env.local` | No | YES |
| `.env.example` | YES | No (weak JWT default) |
| `apps/frontend/.env` | No | YES |
| `apps/frontend/wrangler.toml` | **YES** | **YES** |
| `apps/backend/src/config/env.ts` | YES | YES (JWT default) |
| `packages/auth/src/index.ts` | YES | YES (JWT default) |
| `render.yaml` | YES | No |
| `db.json` | YES | No |
| Test files | YES | LOW (weak passwords) |
