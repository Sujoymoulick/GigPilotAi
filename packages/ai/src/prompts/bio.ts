export function buildBioPrompt(name: string, skills: string[], experienceYears: number): string {
  return `Generate a top-tier Fiverr Profile Bio for ${name}, a freelancer with ${experienceYears} years of experience specializing in ${skills.join(', ')}.
Return valid JSON:
{
  "tagline": "Punchy 1-line profile tagline",
  "storyBio": "Engaging 150-word story bio highlighting expertise, client satisfaction, and guarantee.",
  "bulletPoints": ["Key highlight 1", "Key highlight 2"],
  "languages": ["English (Fluent)"]
}`;
}
