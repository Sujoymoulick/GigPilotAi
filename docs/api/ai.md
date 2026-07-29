# AI API

## Overview

GigPilot AI provides 10 AI-powered content generation tools. Each tool deducts credits from the user's account before generation.

## Credit Costs

| Tool | Credits | Endpoint |
|------|---------|----------|
| Proposal Generator | 1 | `POST /api/proposal/generate` |
| Gig Generator | 2 | `POST /api/gig/generate` |
| Keyword Finder | 1 | `POST /api/keywords/find` |
| Pricing Optimizer | 1 | `POST /api/pricing/optimize` |
| Gig Health Checker | 1 | `POST /api/gig/health` |
| Portfolio Builder | 2 | `POST /api/portfolio/generate` |
| Client Reply | 1 | `POST /api/messages/reply` |
| Review Analyzer | 1 | `POST /api/reviews/analyze` |
| SEO Audit | 1 | `POST /api/seo/audit` |
| Social Post AI | 1 | `POST /api/social/ai/generate` |

## AI Providers

All tools support multiple AI providers via the optional `provider` parameter:

| Provider | Default Model | Key Required |
|----------|---------------|--------------|
| `openai` | gpt-4o-mini | Yes |
| `gemini` | gemini-1.5-flash | Yes |
| `claude` | claude-3-5-sonnet-20241022 | Yes |
| `groq` | llama-3.3-70b-versatile | Yes |
| `openrouter` | meta-llama/llama-3.1-70b-instruct | Yes |

If no provider is specified, defaults to `openai`. If the API key is missing, a simulated response is returned.

---

## History & Favorites

### `GET /api/history`

Get all AI generation history for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "module": "Proposal Generator",
      "input": { ... },
      "output": { ... },
      "tokens_used": 567,
      "provider": "openai",
      "is_favorite": false,
      "created_at": "2026-07-30T12:00:00.000Z"
    }
  ]
}
```

---

### `DELETE /api/history/:id`

Delete a single history record.

**Authentication:** Yes

**Path Parameters:**

| Param | Description |
|-------|-------------|
| `id` | History record UUID |

**Success Response (200):**

```json
{
  "success": true,
  "data": { "success": true }
}
```

---

### `DELETE /api/history`

Clear all history for the authenticated user.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": { "success": true }
}
```

---

### `GET /api/favorites`

Get all favorited AI generation records.

**Authentication:** Yes

**Success Response (200):**

```json
{
  "success": true,
  "data": [ ... ]
}
```

---

### `POST /api/favorites/toggle`

Toggle the favorite status of a history record.

**Authentication:** Yes

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `id` | string | Yes |

**Success Response (200):**

```json
{
  "success": true,
  "data": { "isFavorite": true }
}
```

---

## Proposal Generator

### `POST /api/proposal/generate`

Generate a freelance proposal for a job request.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `jobDescription` | string | Yes | Min 10 chars |
| `myService` | string | Yes | Min 3 chars |
| `tone` | string | No | |
| `provider` | string | No | AI provider name |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "module": "Proposal Generator",
    "input": { ... },
    "output": {
      "subjectLine": "High-Impact Response: Full Stack Development",
      "proposalText": "Hello,\n\nI reviewed your project...",
      "keyHighlights": ["Custom design assets", "Responsive layout"],
      "suggestedQuestions": ["What are the core timelines?"],
      "callToAction": "Send me a message to get started."
    },
    "tokens_used": 567,
    "provider": "openai",
    "is_favorite": false
  }
}
```

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/proposal/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "jobDescription": "Need a landing page for my SaaS product",
    "myService": "Full Stack Web Development",
    "tone": "Professional"
  }'
```

---

## Gig Generator

### `POST /api/gig/generate`

Generate a complete Fiverr gig listing with SEO title, description, packages, FAQs, and tags.

**Authentication:** Yes | **Credits:** 2

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `service` | string | Yes | Min 3 chars |
| `category` | string | No | |
| `provider` | string | No | |

**Success Response (200):**

Returns a special envelope with `data` and `meta`:

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "uuid",
    "title": "I will do expert Logo Design",
    "category": "Graphic Design",
    "content": {
      "seoTitle": "I will do expert Logo Design",
      "description": "Need expert help with Logo Design?...",
      "packages": {
        "basic": { "name": "Basic", "price": 25, "deliveryDays": 3 },
        "standard": { "name": "Standard", "price": 65, "deliveryDays": 5 },
        "premium": { "name": "Premium", "price": 150, "deliveryDays": 7 }
      },
      "faqs": [],
      "tags": ["logo-design"],
      "callToAction": "Order now!"
    },
    "status": "draft"
  },
  "meta": {
    "tokensUsed": 1234,
    "provider": "openai"
  }
}
```

---

## Keyword Finder

### `POST /api/keywords/find`

Research SEO keywords with search volume, competition, and opportunity metrics.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `service` | string | Yes | Min 2 chars |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "primaryKeywords": [
        {
          "keyword": "logo design",
          "type": "primary",
          "estimatedSearchVolume": 12000,
          "competitionLevel": "Medium",
          "difficultyScore": 50,
          "opportunityScore": 75,
          "trend": "Stable",
          "intent": "Transactional"
        }
      ],
      "longTailKeywords": [],
      "relatedSearches": [],
      "competitorKeywords": [],
      "summary": {
        "avgDifficulty": 50,
        "avgOpportunity": 75,
        "recommendedFocus": []
      }
    }
  }
}
```

---

## Pricing Optimizer

### `POST /api/pricing/optimize`

Get data-driven pricing recommendations based on market analysis.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `experience` | string | Yes | |
| `category` | string | Yes | |
| `country` | string | Yes | |
| `competition` | string | Yes | `Low`, `Medium`, or `High` |
| `deliveryTimeDays` | number | Yes | Coerced to number |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "basicPrice": 20,
      "standardPrice": 50,
      "premiumPrice": 120,
      "recommendedExtras": [],
      "recommendedDiscounts": [],
      "competitiveAnalysis": "Sweet spot analysis..."
    }
  }
}
```

---

## Gig Health Checker

### `POST /api/gig/health`

Score and get optimization suggestions for an existing gig listing.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | Min 5 chars |
| `description` | string | Yes | Min 20 chars |
| `faqs` | string | No | |
| `packages` | string | No | |
| `tags` | string | No | |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "overallScore": 82,
      "seoScore": 85,
      "readabilityScore": 90,
      "ctaScore": 80,
      "keywordDensityScore": 78,
      "grammarScore": 95,
      "trustScore": 88,
      "conversionScore": 80,
      "suggestions": []
    }
  }
}
```

---

## Portfolio Builder

### `POST /api/portfolio/generate`

Generate professional portfolio copy, case studies, and LinkedIn about section.

**Authentication:** Yes | **Credits:** 2

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `role` | string | Yes | Min 3 chars |
| `skills` | string[] | Yes | Min 1 item |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "aboutMe": "I am an expert freelance professional...",
      "caseStudies": [],
      "projectDescriptions": [],
      "testimonials": [],
      "portfolioWebsiteCopy": "",
      "linkedInAbout": ""
    }
  }
}
```

---

## Client Message Reply

### `POST /api/messages/reply`

Generate a professional reply to a client message.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `clientMessage` | string | Yes | Min 5 chars |
| `type` | string | Yes | |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "replyText": "Hi there, thank you for writing...",
      "tone": "professional",
      "alternativeOptions": []
    }
  }
}
```

---

## Review Analyzer

### `POST /api/reviews/analyze`

Analyze review sentiment and extract insights.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `reviewsText` | string | Yes | Min 10 chars |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "positiveCount": 10,
      "negativeCount": 0,
      "overallSentimentScore": 100,
      "commonComplaints": [],
      "strengths": [],
      "weaknesses": [],
      "recommendations": [],
      "sentimentBreakdown": [],
      "topKeywords": []
    }
  }
}
```

---

## SEO Audit

### `POST /api/seo/audit`

Audit gig SEO performance and get optimization tips.

**Authentication:** Yes | **Credits:** 1

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `title` | string | Yes | Min 5 chars |
| `description` | string | Yes | Min 20 chars |
| `keywords` | string[] | Yes | Min 1 item |
| `provider` | string | No | |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "output": {
      "seoScore": 78,
      "keywordScore": 80,
      "ctrPrediction": 9.5,
      "missingKeywords": [],
      "optimizationTips": [],
      "titleSuggestions": []
    }
  }
}
```

## Versioned Endpoints

All AI endpoints have `/api/v1/...` equivalents:

- `GET /api/v1/ai/history`
- `DELETE /api/v1/ai/history/:id`
- `DELETE /api/v1/ai/history`
- `GET /api/v1/ai/favorites`
- `POST /api/v1/ai/favorites/toggle`
- `POST /api/v1/projects/proposals/generate`
- `POST /api/v1/gigs/generate`
- `POST /api/v1/ai/keywords/find`
- `POST /api/v1/ai/pricing/optimize`
- `POST /api/v1/gigs/health/check`
- `POST /api/v1/ai/portfolio/generate`
- `POST /api/v1/ai/messages/reply`
- `POST /api/v1/ai/reviews/analyze`
- `POST /api/v1/ai/seo/audit`

## Related

- [Auth API](auth.md) (for token)
- [Billing API](payments.md) (for credits)
- [SDK Examples](../SDK_EXAMPLES.md)
