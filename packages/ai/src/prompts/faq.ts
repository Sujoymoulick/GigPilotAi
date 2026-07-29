export function buildFaqPrompt(service: string, category: string): string {
  return `Generate 5 high-converting, trust-building FAQs for a Fiverr Gig offering '${service}' under category '${category}'.
Return valid JSON:
{
  "faqs": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"}
  ]
}`;
}
