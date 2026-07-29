import type { AIService, AIServiceOptions, AIGenerateResult } from '../interfaces/AIService';

export class GroqProvider implements AIService {
  public providerName = 'Groq';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
  }

  async generate(prompt: string, options?: AIServiceOptions): Promise<AIGenerateResult> {
    const model = options?.model || 'llama-3.3-70b-versatile';
    if (this.apiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
              { role: 'user', content: prompt }
            ]
          })
        });
        const data = await res.json() as any;
        if (data.choices?.[0]?.message?.content) {
          return {
            text: data.choices[0].message.content,
            tokensUsed: data.usage?.total_tokens || this.estimateTokens(prompt),
            provider: this.providerName,
            model
          };
        }
      } catch (e) {
        console.warn('Groq provider request failed', e);
      }
    }
    return {
      text: prompt.includes('JSON') || options?.jsonMode ? '{}' : 'Generated content from Groq',
      tokensUsed: this.estimateTokens(prompt) + 90,
      provider: this.providerName,
      model: `${model} (Simulated)`
    };
  }

  async stream(prompt: string, onChunk: (chunk: string) => void, options?: AIServiceOptions): Promise<AIGenerateResult> {
    const res = await this.generate(prompt, options);
    onChunk(res.text);
    return res;
  }

  estimateTokens(prompt: string): number {
    return Math.ceil(prompt.length / 4);
  }

  async moderate(text: string): Promise<{ flagged: boolean; reason?: string }> {
    return { flagged: false };
  }
}
