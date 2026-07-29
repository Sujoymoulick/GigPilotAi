import type { PortfolioInput, ClientReplyInput } from '@gigpilot/shared';

export function buildPortfolioPrompt(input: PortfolioInput): string {
  return `You are a professional personal brand strategist for top 1% freelancers.
Build compelling portfolio assets for:

Role: ${input.role}
Skills: ${input.skills.join(', ')}
${input.pastProjects ? `Past Projects / Context: ${input.pastProjects}` : ''}

Return valid JSON:
{
  "aboutMe": "Compelling story-driven About Me bio (200 words)",
  "caseStudies": [
    {
      "title": "E-Commerce Brand Rebrand",
      "problem": "Brand lacked modern appeal and had low checkout conversion rate.",
      "solution": "Redesigned complete visual identity, typography system, and UI kit.",
      "outcome": "+42% increase in sales conversion and 5-star client review."
    }
  ],
  "projectDescriptions": [
    {
      "title": "SaaS Dashboard Redesign",
      "description": "High converting dark mode interface designed in Figma.",
      "tags": ["Figma", "UI/UX", "Dashboard"]
    }
  ],
  "testimonials": [
    {"clientName": "Alex Rivera", "quote": "Transformed our digital presence overnight!", "rating": 5}
  ],
  "portfolioWebsiteCopy": "High converting hero headline and subheadline for personal portfolio website",
  "linkedInAbout": "Optimized LinkedIn About section with keyword density"
}`;
}

export function buildReplyPrompt(input: ClientReplyInput): string {
  return `You are an expert freelancer client relations manager.
Draft the ideal client reply message for the following scenario:

Scenario / Type: ${input.type}
Client Message: "${input.clientMessage}"
${input.context ? `Additional Context: ${input.context}` : ''}

Return valid JSON:
{
  "replyText": "Polite, firm, professional message body tailored to the exact situation.",
  "tone": "${input.type} & empathetic",
  "alternativeOptions": [
    "Alternative reply 1 (Shorter)",
    "Alternative reply 2 (More assertive / Upsell focused)"
  ]
}`;
}
