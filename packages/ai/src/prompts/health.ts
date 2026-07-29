import type { GigHealthInput } from '@gigpilot/shared';

export function buildGigHealthPrompt(input: GigHealthInput): string {
  return `You are a professional Fiverr Gig Quality inspector.
Analyze this Gig details and calculate the scores and actionable improvement suggestions:

Title: ${input.title}
Description: ${input.description}
${input.faqs ? `FAQs: ${input.faqs}` : ''}
${input.packages ? `Packages: ${input.packages}` : ''}
${input.tags ? `Tags: ${input.tags}` : ''}

Return valid JSON:
{
  "overallScore": 80,
  "seoScore": 85,
  "readabilityScore": 92,
  "ctaScore": 78,
  "keywordDensityScore": 70,
  "grammarScore": 95,
  "trustScore": 85,
  "conversionScore": 82,
  "suggestions": [
    {
      "category": "Call to Action",
      "severity": "High",
      "issue": "Missing explicit CTA at the end of the Gig description.",
      "actionableFix": "Add 'Please contact me in inbox before ordering to align custom requirements!' to your description footer."
    },
    {
      "category": "Keyword Density",
      "severity": "Medium",
      "issue": "Density of primary service terms is low.",
      "actionableFix": "Repeat the core service keywords 2 more times in the Description paragraphs."
    }
  ]
}`;
}
