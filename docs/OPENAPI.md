# OpenAPI Specification

> Generated from the actual GigPilot AI codebase. Only discovered endpoints are included.

```yaml
openapi: 3.0.3
info:
  title: GigPilot AI API
  description: |
    AI-powered freelancer toolkit API. Provides gig generation, proposal writing,
    keyword research, pricing optimization, social media management, and more.
  version: 1.0.0
  contact:
    name: GigPilot AI Support
    url: https://github.com/anomalyco/gigpilotai/issues

servers:
  - url: http://localhost:3000
    description: Development
  - url: https://api.gigpilot.ai
    description: Production

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    SuccessResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        message:
          type: string
        data:
          type: object

    ErrorResponse:
      type: object
      properties:
        success:
          type: boolean
          example: false
        message:
          type: string
        error:
          type: object

    LoginRequest:
      type: object
      required: [email]
      properties:
        email:
          type: string
          format: email
        fullName:
          type: string
        password:
          type: string
          minLength: 6

    MagicLinkRequest:
      type: object
      required: [email]
      properties:
        email:
          type: string
          format: email

    ProposalGenerateRequest:
      type: object
      required: [jobDescription, myService]
      properties:
        jobDescription:
          type: string
          minLength: 10
        myService:
          type: string
          minLength: 3
        tone:
          type: string
        provider:
          type: string

    GigGenerateRequest:
      type: object
      required: [service]
      properties:
        service:
          type: string
          minLength: 3
        category:
          type: string
        provider:
          type: string

    KeywordsFindRequest:
      type: object
      required: [service]
      properties:
        service:
          type: string
          minLength: 2
        provider:
          type: string

    PricingOptimizeRequest:
      type: object
      required: [experience, category, country, competition, deliveryTimeDays]
      properties:
        experience:
          type: string
        category:
          type: string
        country:
          type: string
        competition:
          type: string
          enum: [Low, Medium, High]
        deliveryTimeDays:
          type: number
        provider:
          type: string

    GigHealthCheckRequest:
      type: object
      required: [title, description]
      properties:
        title:
          type: string
          minLength: 5
        description:
          type: string
          minLength: 20
        faqs:
          type: string
        packages:
          type: string
        tags:
          type: string
        provider:
          type: string

    PortfolioGenerateRequest:
      type: object
      required: [role, skills]
      properties:
        role:
          type: string
          minLength: 3
        skills:
          type: array
          items:
            type: string
          minItems: 1
        provider:
          type: string

    ClientMessageReplyRequest:
      type: object
      required: [clientMessage, type]
      properties:
        clientMessage:
          type: string
          minLength: 5
        type:
          type: string
        provider:
          type: string

    ReviewAnalyzeRequest:
      type: object
      required: [reviewsText]
      properties:
        reviewsText:
          type: string
          minLength: 10
        provider:
          type: string

    SeoAuditRequest:
      type: object
      required: [title, description, keywords]
      properties:
        title:
          type: string
          minLength: 5
        description:
          type: string
          minLength: 20
        keywords:
          type: array
          items:
            type: string
          minItems: 1
        provider:
          type: string

    UpgradeRequest:
      type: object
      required: [plan]
      properties:
        plan:
          type: string
          enum: [Free, Pro, Agency]
        razorpayPaymentId:
          type: string
        coupon:
          type: string

    ConnectSocialRequest:
      type: object
      required: [provider, code]
      properties:
        provider:
          type: string
        code:
          type: string
        redirectUri:
          type: string
          format: uri

    PostCrudRequest:
      type: object
      required: [content]
      properties:
        id:
          type: string
        title:
          type: string
        content:
          type: string
          minLength: 1
        hashtags:
          type: string
        mentions:
          type: string
        link:
          type: string
        mediaUrls:
          type: array
          items:
            type: string
        status:
          type: string

    PostPublishRequest:
      type: object
      required: [accountIds]
      properties:
        postId:
          type: string
        title:
          type: string
        content:
          type: string
        url:
          type: string
        mediaUrls:
          type: array
          items:
            type: string
        accountIds:
          type: array
          items:
            type: string
          minItems: 1

    PostScheduleRequest:
      type: object
      required: [content, scheduledTime, accountIds]
      properties:
        title:
          type: string
        content:
          type: string
          minLength: 1
        url:
          type: string
        mediaUrls:
          type: array
          items:
            type: string
        scheduledTime:
          type: string
          format: date-time
        timezone:
          type: string
        accountIds:
          type: array
          items:
            type: string
          minItems: 1

    StorageUploadRequest:
      type: object
      required: [filename, data]
      properties:
        filename:
          type: string
        contentType:
          type: string
          default: image/jpeg
        data:
          type: string
          description: Base64-encoded file content

    SocialAiGenerateRequest:
      type: object
      required: [action]
      properties:
        action:
          type: string
          enum: [generate, rewrite, suggest]
        prompt:
          type: string
        content:
          type: string
        platform:
          type: string
        tone:
          type: string
        length:
          type: string

paths:
  /api/health:
    get:
      summary: Health check
      tags: [Health]
      responses:
        '200':
          description: Server is online
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  system:
                    type: string
                  timestamp:
                    type: string

  /api/auth/login:
    post:
      summary: Login and sync profile
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Login successful
        '400':
          description: Validation failed

  /api/auth/magic-link:
    post:
      summary: Generate magic link
      tags: [Auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MagicLinkRequest'
      responses:
        '200':
          description: Magic link generated

  /api/auth/me:
    get:
      summary: Get current user profile
      tags: [Auth]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Profile loaded
        '401':
          description: Unauthorized

  /api/history:
    get:
      summary: Get AI history
      tags: [AI]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: History list
    delete:
      summary: Clear all history
      tags: [AI]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: History cleared

  /api/history/{id}:
    delete:
      summary: Delete history record
      tags: [AI]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Record deleted

  /api/favorites/toggle:
    post:
      summary: Toggle favorite
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [id]
              properties:
                id:
                  type: string
      responses:
        '200':
          description: Favorite toggled

  /api/proposal/generate:
    post:
      summary: Generate proposal
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ProposalGenerateRequest'
      responses:
        '200':
          description: Proposal generated
        '400':
          description: Validation failed

  /api/gig/generate:
    post:
      summary: Generate gig
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GigGenerateRequest'
      responses:
        '200':
          description: Gig generated

  /api/keywords/find:
    post:
      summary: Find keywords
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/KeywordsFindRequest'
      responses:
        '200':
          description: Keywords found

  /api/pricing/optimize:
    post:
      summary: Optimize pricing
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PricingOptimizeRequest'
      responses:
        '200':
          description: Pricing optimized

  /api/gig/health:
    post:
      summary: Check gig health
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GigHealthCheckRequest'
      responses:
        '200':
          description: Health checked

  /api/portfolio/generate:
    post:
      summary: Generate portfolio
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PortfolioGenerateRequest'
      responses:
        '200':
          description: Portfolio generated

  /api/messages/reply:
    post:
      summary: Generate client reply
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ClientMessageReplyRequest'
      responses:
        '200':
          description: Reply generated

  /api/reviews/analyze:
    post:
      summary: Analyze reviews
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReviewAnalyzeRequest'
      responses:
        '200':
          description: Reviews analyzed

  /api/seo/audit:
    post:
      summary: Run SEO audit
      tags: [AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SeoAuditRequest'
      responses:
        '200':
          description: SEO audited

  /api/social/accounts:
    get:
      summary: List connected accounts
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Accounts list

  /api/social/connect:
    post:
      summary: Connect social account
      tags: [Social]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConnectSocialRequest'
      responses:
        '200':
          description: Account connected

  /api/social/posts:
    get:
      summary: List posts
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Posts list
    post:
      summary: Create/update post
      tags: [Social]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostCrudRequest'
      responses:
        '200':
          description: Post saved

  /api/social/posts/{id}:
    delete:
      summary: Delete post
      tags: [Social]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Post deleted

  /api/social/publish:
    post:
      summary: Publish immediately
      tags: [Social]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostPublishRequest'
      responses:
        '200':
          description: Post published

  /api/social/schedule:
    post:
      summary: Schedule post
      tags: [Social]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostScheduleRequest'
      responses:
        '200':
          description: Post scheduled

  /api/social/scheduler/run:
    post:
      summary: Run scheduler
      tags: [Scheduler]
      responses:
        '200':
          description: Scheduler executed

  /api/social/analytics:
    get:
      summary: Get social analytics
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Analytics data

  /api/social/campaigns:
    get:
      summary: List campaigns
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Campaigns list
    post:
      summary: Create/update campaign
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Campaign saved

  /api/social/campaigns/{id}:
    delete:
      summary: Delete campaign
      tags: [Social]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Campaign deleted

  /api/social/media:
    get:
      summary: List media
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Media list
    post:
      summary: Add media
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Media added

  /api/social/media/{id}:
    delete:
      summary: Delete media
      tags: [Social]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Media deleted

  /api/social/settings:
    get:
      summary: Get social settings
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Settings
    put:
      summary: Update social settings
      tags: [Social]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Settings updated

  /api/social/ai/generate:
    post:
      summary: AI content generation
      tags: [Social, AI]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SocialAiGenerateRequest'
      responses:
        '200':
          description: Content generated

  /api/analytics:
    get:
      summary: Get dashboard analytics
      tags: [Analytics]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Dashboard data

  /api/notifications:
    get:
      summary: List notifications
      tags: [Notifications]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Notifications list

  /api/notifications/unread:
    get:
      summary: Get unread count
      tags: [Notifications]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Unread count

  /api/notifications/read-all:
    post:
      summary: Mark all as read
      tags: [Notifications]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: All marked read

  /api/notifications/{id}:
    delete:
      summary: Delete notification
      tags: [Notifications]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Notification deleted

  /api/billing:
    get:
      summary: Get billing details
      tags: [Billing]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Billing details

  /api/billing/upgrade:
    post:
      summary: Upgrade plan
      tags: [Billing]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpgradeRequest'
      responses:
        '200':
          description: Plan upgraded

  /api/settings:
    get:
      summary: Get settings
      tags: [Settings]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Settings
    put:
      summary: Update settings
      tags: [Settings]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Settings updated

  /api/storage/upload:
    post:
      summary: Upload file
      tags: [Storage]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/StorageUploadRequest'
      responses:
        '200':
          description: File uploaded
        '400':
          description: Invalid file
```

## Related

- [API Index](API_INDEX.md)
- [API Reference](API_REFERENCE.md)
