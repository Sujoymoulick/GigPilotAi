import type { PricingOptimizerInput } from '@gigpilot/shared';

export function buildPricingPrompt(input: PricingOptimizerInput): string {
  return `You are a freelance pricing strategy & revenue optimization expert.
Analyze market pricing and calculate optimal tier pricing for this Fiverr service:

Experience: ${input.experience}
Category: ${input.category}
Country: ${input.country}
Competition Level: ${input.competition}
Delivery Time (Days): ${input.deliveryTimeDays}

Return valid JSON:
{
  "basicPrice": 25,
  "standardPrice": 65,
  "premiumPrice": 150,
  "recommendedExtras": [
    {"name": "Extra Fast 24-hr Delivery", "price": 30, "deliveryDays": 1},
    {"name": "Additional Revision", "price": 15, "deliveryDays": 1}
  ],
  "recommendedDiscounts": [
    {"type": "First Order Discount", "percentage": 10, "rationale": "Attract initial reviews"}
  ],
  "competitiveAnalysis": "Detailed competitive positioning overview..."
}`;
}
