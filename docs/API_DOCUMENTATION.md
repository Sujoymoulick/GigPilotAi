# GigPilot AI REST API Documentation

This document describes the API endpoints, request validators, and response structures for the GigPilot AI SaaS backend.

## Response Format

All endpoints return a standardized JSON envelope structure:

### Success Response (HTTP 200/201)
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

### Error Response (HTTP 400/401/403/404/429/500)
```json
{
  "success": false,
  "message": "Error description message",
  "error": { ... }
}
```

---

## Authentication & Headers

Protected endpoints require the **Authorization** header:
```http
Authorization: Bearer <Supabase_JWT_Token>
```

---

## Endpoints Summary

### 1. Authentication (`/api/v1/auth`)

#### Authenticate and Sync User Profile
- **Method:** `POST`
- **Route:** `/api/v1/auth/login` (legacy: `/api/auth/login`)
- **Payload:**
  ```json
  {
    "email": "user@example.com",
    "fullName": "John Doe"
  }
  ```
- **Response:** Returns verified user profile and session token.

#### Get Current Authenticated User Details
- **Method:** `GET`
- **Route:** `/api/v1/auth/me` (legacy: `/api/auth/me`)
- **Response:** Returns verified profile details.

---

### 2. AI Generative Assistant (`/api/v1/ai`)

#### Generate Proposal Copy
- **Method:** `POST`
- **Route:** `/api/v1/projects/proposals/generate` (legacy: `/api/proposal/generate`)
- **Payload:**
  ```json
  {
    "jobDescription": "Need a developer to build a responsive React webapp.",
    "myService": "Frontend Engineering with Tailwind and Nextjs",
    "tone": "Professional",
    "provider": "gemini"
  }
  ```

#### Generate Gig Detail
- **Method:** `POST`
- **Route:** `/api/v1/gigs/generate` (legacy: `/api/gig/generate`)
- **Payload:**
  ```json
  {
    "service": "Next.js Web Development",
    "category": "Programming & Tech",
    "provider": "openai"
  }
  ```

#### Find High-Opportunity Tags & Keywords
- **Method:** `POST`
- **Route:** `/api/v1/ai/keywords/find` (legacy: `/api/keywords/find`)
- **Payload:**
  ```json
  {
    "service": "UI UX Design"
  }
  ```

#### Optimize Gig Pricing Tiers
- **Method:** `POST`
- **Route:** `/api/v1/ai/pricing/optimize` (legacy: `/api/pricing/optimize`)
- **Payload:**
  ```json
  {
    "experience": "Expert",
    "category": "Graphics & Design",
    "country": "United States",
    "competition": "Medium",
    "deliveryTimeDays": 5
  }
  ```

#### Perform SEO Optimization & CTR Prediction
- **Method:** `POST`
- **Route:** `/api/v1/ai/seo/audit` (legacy: `/api/seo/audit`)
- **Payload:**
  ```json
  {
    "title": "I will do modern Figma UI design",
    "description": "Looking for expert UI/UX designer? I build clean landing pages...",
    "keywords": ["ui design", "figma landing page"]
  }
  ```

---

### 3. Social Media Hub (`/api/v1/social`)

#### Get Connected Social Profiles
- **Method:** `GET`
- **Route:** `/api/v1/social/accounts` (legacy: `/api/social/accounts`)

#### Connect a Social Platform (OAuth)
- **Method:** `POST`
- **Route:** `/api/v1/social/connect` (legacy: `/api/social/connect`)
- **Payload:**
  ```json
  {
    "provider": "linkedin",
    "code": "oauth_authorization_code_here",
    "redirectUri": "http://localhost:3000/social/callback"
  }
  ```

#### Publish Post Immediately
- **Method:** `POST`
- **Route:** `/api/v1/social/publish` (legacy: `/api/social/publish`)
- **Payload:**
  ```json
  {
    "title": "New Release",
    "content": "Just launched version 2.0 with clean API structures!",
    "accountIds": ["uuid_of_social_account_1"]
  }
  ```

#### Schedule Post
- **Method:** `POST`
- **Route:** `/api/v1/social/schedule` (legacy: `/api/social/schedule`)
- **Payload:**
  ```json
  {
    "title": "Scheduled announcement",
    "content": "Make sure to check this blog post tomorrow!",
    "scheduledTime": "2026-08-30T10:00:00Z",
    "accountIds": ["uuid_of_social_account_1"]
  }
  ```

---

### 4. Billing & Payments (`/api/v1/payments`)

#### Get Invoice History & Plan Status
- **Method:** `GET`
- **Route:** `/api/v1/payments/billing` (legacy: `/api/billing`)

#### Upgrade Plan
- **Method:** `POST`
- **Route:** `/api/v1/payments/upgrade` (legacy: `/api/billing/upgrade`)
- **Payload:**
  ```json
  {
    "plan": "Pro",
    "razorpayPaymentId": "pay_XYZ123456",
    "coupon": "LAUNCH20"
  }
  ```

---

### 5. File Storage & Uploads (`/api/v1/storage`)

#### Upload File to Supabase Storage
- **Method:** `POST`
- **Route:** `/api/v1/storage/upload` (legacy: `/api/storage/upload`)
- **Payload:**
  ```json
  {
    "filename": "screenshot.png",
    "contentType": "image/png",
    "data": "base64_encoded_file_string_here"
  }
  ```
- **Response:** Returns the saved file path and a 24-hour temporary signed URL.
