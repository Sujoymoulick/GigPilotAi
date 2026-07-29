import type { ReviewAnalyzerInput } from '@gigpilot/shared';

export function buildReviewPrompt(input: ReviewAnalyzerInput): string {
  return `You are a customer feedback and business sentiment analytics expert.
Analyze the following client reviews for a freelancer:

Reviews Raw Text:
"${input.reviewsText}"

Return valid JSON:
{
  "positiveCount": 18,
  "negativeCount": 2,
  "overallSentimentScore": 91,
  "commonComplaints": ["Delivery delays by 1 day", "Initial communication gap"],
  "strengths": ["Outstanding design quality", "Great attention to detail", "Responsive revisions"],
  "weaknesses": ["Time management under tight deadlines"],
  "recommendations": [
    "Set 48-hour delivery buffer in package settings",
    "Send automated milestone update upon order placement"
  ],
  "sentimentBreakdown": [
    {"label": "5 Star Positive", "percentage": 85},
    {"label": "4 Star Good", "percentage": 10},
    {"label": "Critical", "percentage": 5}
  ],
  "topKeywords": [
    {"word": "Quality", "count": 14},
    {"word": "Fast", "count": 9},
    {"word": "Communication", "count": 8}
  ]
}`;
}
