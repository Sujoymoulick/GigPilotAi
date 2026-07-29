# Quick Start

## Prerequisites

- Node.js >= 22.12
- npm or pnpm
- Supabase account (free tier works)
- AI provider API key (at least one: OpenAI, Gemini, etc.)

## 1. Clone and Install

```bash
git clone https://github.com/anomalyco/gigpilotai.git
cd gigpilotai
npm install
```

## 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-random-secret

# At least one AI provider
OPENAI_API_KEY=sk-proj-...

# Frontend URL for CORS
FRONTEND_URL=http://localhost:4321
```

## 3. Start Development

### Backend API (port 3000)

```bash
cd apps/backend
npm run dev
```

### Frontend (port 4321)

```bash
cd apps/frontend
npm run dev
```

## 4. Verify

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "online",
  "system": "GigPilot AI API Fastify Server",
  "timestamp": "2026-07-30T12:00:00.000Z"
}
```

## 5. First API Call

### Login (mock mode)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "fullName": "Test User"}'
```

Response:

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "token": "eyJ1c2VySWQi...",
    "user": {
      "id": "...",
      "email": "test@example.com",
      "full_name": "Test User",
      "role": "Pro",
      "credits_remaining": 450
    }
  }
}
```

### Generate a Proposal

```bash
curl -X POST http://localhost:3000/api/proposal/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "jobDescription": "Need a landing page for my SaaS product",
    "myService": "Full Stack Web Development",
    "tone": "Professional"
  }'
```

## Default Plans

| Plan | Credits | Price |
|------|---------|-------|
| Free | 50 | $0 |
| Pro | 500 | $29/mo |
| Agency | 2,000 | $89/mo |

Use coupon `LAUNCH20` for 20% off.

## Next Steps

- [Authentication Guide](AUTHENTICATION.md)
- [API Reference](API_REFERENCE.md)
- [Architecture](ARCHITECTURE.md)
