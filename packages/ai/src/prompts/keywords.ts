import type { KeywordFinderInput } from '@gigpilot/shared';

export function buildKeywordsPrompt(input: KeywordFinderInput): string {
  return `You are a search engine and Fiverr search algorithm (A9/Fiverr SEO) specialist.
Find high-intent, low-competition keywords for:

Service: ${input.service}
${input.category ? `Category: ${input.category}` : ''}

Return valid JSON:
{
  "primaryKeywords": [
    {"keyword": "fiverr gig title keyword", "type": "primary", "estimatedSearchVolume": 12500, "competitionLevel": "Medium", "difficultyScore": 55, "opportunityScore": 82, "trend": "Rising", "intent": "Transactional"}
  ],
  "longTailKeywords": [
    {"keyword": "custom professional logo design for tech startup", "type": "long-tail", "estimatedSearchVolume": 3400, "competitionLevel": "Low", "difficultyScore": 28, "opportunityScore": 94, "trend": "Rising", "intent": "Transactional"}
  ],
  "relatedSearches": [
    {"keyword": "minimalist brand identity", "type": "related", "estimatedSearchVolume": 6100, "competitionLevel": "Medium", "difficultyScore": 42, "opportunityScore": 75, "trend": "Stable", "intent": "Commercial"}
  ],
  "competitorKeywords": [
    {"keyword": "top rated vector tracing", "type": "competitor", "estimatedSearchVolume": 8900, "competitionLevel": "High", "difficultyScore": 78, "opportunityScore": 50, "trend": "Stable", "intent": "Commercial"}
  ],
  "summary": {
    "avgDifficulty": 45,
    "avgOpportunity": 85,
    "recommendedFocus": ["Focus on long-tail niche keywords first", "Include top tag in gig package descriptions"]
  }
}`;
}
