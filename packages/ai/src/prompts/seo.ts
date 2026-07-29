import type { SEOAuditInput } from '@gigpilot/shared';

export function buildSEOAuditPrompt(input: SEOAuditInput): string {
  return `You are a search engine optimization and CTR analyst.
Analyze the following Fiverr gig parameters for keywords alignment, keyword stuffings, CTR, duplication and readability:

Title: ${input.title}
Description: ${input.description}
Target Keywords: ${input.keywords.join(', ')}
${input.faqs ? `FAQs: ${input.faqs}` : ''}
${input.packages ? `Packages: ${input.packages}` : ''}

Return valid JSON:
{
  "seoScore": 85,
  "keywordScore": 88,
  "ctrPrediction": 12.5,
  "missingKeywords": ["nextjs landing page", "responsive react UI"],
  "optimizationTips": [
    "Place the primary keyword 'nextjs' in the first 80 characters of the title.",
    "Introduce at least 2 long-tail keywords in your FAQs section.",
    "Add bold keywords in the middle paragraph of your description."
  ],
  "titleSuggestions": [
    "I will build high converting nextjs landing page and react web app",
    "I will design responsive nextjs application using tailwind css"
  ]
}`;
}
