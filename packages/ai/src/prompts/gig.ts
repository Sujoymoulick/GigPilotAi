import type { GigGeneratorInput } from '@gigpilot/shared';

export function buildGigPrompt(input: GigGeneratorInput): string {
  return `You are a world-class Fiverr SEO Optimization Expert and Freelance Copywriter.
Create a top 1% converting Fiverr Gig package based on these parameters:

Category: ${input.category}
Subcategory: ${input.subcategory}
Service: ${input.service}
Experience: ${input.experience}
Target Audience: ${input.targetAudience}
Tone: ${input.tone}
${input.country ? `Target Country: ${input.country}` : ''}
${input.language ? `Language: ${input.language}` : 'Language: English'}
${input.competitorUrls ? `Competitor Inspiration: ${input.competitorUrls.join(', ')}` : ''}
${input.additionalNotes ? `Notes: ${input.additionalNotes}` : ''}

You MUST return a strictly formatted JSON object with the following fields:
{
  "seoTitle": "Fiverr Title under 80 characters (starts with 'I will ...')",
  "description": "Full persuasive gig description with formatted bullet points, clear structure, and benefits",
  "packages": {
    "basic": {
      "name": "Basic",
      "title": "Short tier title",
      "description": "Short explanation of what is included",
      "deliveryDays": 1,
      "revisions": "1 Revision",
      "price": 25,
      "features": ["Feature 1", "Feature 2", "Feature 3"]
    },
    "standard": {
      "name": "Standard",
      "title": "Short tier title",
      "description": "Short explanation of what is included",
      "deliveryDays": 3,
      "revisions": "3 Revisions",
      "price": 65,
      "features": ["Everything in Basic", "Feature A", "Feature B"]
    },
    "premium": {
      "name": "Premium",
      "title": "Short tier title",
      "description": "Short explanation of what is included",
      "deliveryDays": 5,
      "revisions": "Unlimited",
      "price": 140,
      "features": ["Everything in Standard", "VIP Support", "Commercial Rights"]
    }
  },
  "faqs": [
    {"question": "What information do I need to get started?", "answer": "Detailed answer..."}
  ],
  "requirements": ["Requirement 1", "Requirement 2"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "callToAction": "Order now to get started!",
  "imagePrompt": "Detailed AI image generation prompt for Midjourney/DALL-E to build a high-CTR thumbnail grid or hero graphic.",
  "videoScript": "30-second high-energy Fiverr intro video script outline.",
  "upsellSuggestions": ["Suggest 1-day rush delivery +$30", "Suggest source files +$25"]
}

Ensure the response contains valid JSON without Markdown wrapping.`;
}
