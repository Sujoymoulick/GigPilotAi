import type { AIService, AIServiceOptions, AIGenerateResult } from '../interfaces/AIService';

export class ClaudeProvider implements AIService {
  public providerName = 'Anthropic Claude';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
  }

  async generate(prompt: string, options?: AIServiceOptions): Promise<AIGenerateResult> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    if (this.apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model,
            max_tokens: options?.maxTokens ?? 2048,
            system: options?.systemPrompt,
            messages: [{ role: 'user', content: prompt }]
          })
        });
        const data = await res.json() as any;
        if (data.content?.[0]?.text) {
          return {
            text: data.content[0].text,
            tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0) || this.estimateTokens(prompt),
            provider: this.providerName,
            model
          };
        }
      } catch (e) {
        console.warn('Claude provider request failed, fallback engaged', e);
      }
    }
    return {
      text: prompt.includes('JSON') || options?.jsonMode ? '{}' : 'Generated content from Anthropic Claude',
      tokensUsed: this.estimateTokens(prompt) + 110,
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
