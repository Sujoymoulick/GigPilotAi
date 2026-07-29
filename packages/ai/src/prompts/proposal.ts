import type { ProposalInput } from '@gigpilot/shared';

export function buildProposalPrompt(input: ProposalInput): string {
  return `You are a high-converting Fiverr proposals & communication expert.
Generate a high-impact proposal / response for the following:

Type: ${input.type}
Buyer Name: ${input.buyerName || 'Valued Client'}
Job Description / Buyer Request: ${input.jobDescription}
My Service / Value Proposition: ${input.myService}
Tone: ${input.tone}
${input.pricingEstimate ? `Pricing Estimate: ${input.pricingEstimate}` : ''}
${input.deliveryTime ? `Delivery Time: ${input.deliveryTime}` : ''}

Return a valid JSON object:
{
  "subjectLine": "Attention grabbing line or subject",
  "proposalText": "Complete response copy with greeting, solution pitch, social proof, call to action",
  "keyHighlights": ["Highlight 1", "Highlight 2"],
  "suggestedQuestions": ["Question to ask buyer to open dialogue?"],
  "callToAction": "Clear next step CTA"
}`;
}
