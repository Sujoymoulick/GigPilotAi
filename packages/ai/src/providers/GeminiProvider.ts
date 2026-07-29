import type { AIService, AIServiceOptions, AIGenerateResult } from '../interfaces/AIService';

export class GeminiProvider implements AIService {
  public providerName = 'Google Gemini';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
  }

  async generate(prompt: string, options?: AIServiceOptions): Promise<AIGenerateResult> {
    const model = options?.model || 'gemini-1.5-flash';
    if (this.apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${options?.systemPrompt ? options.systemPrompt + '\n\n' : ''}${prompt}` }] }]
          })
        });
        const data = await res.json() as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            text,
            tokensUsed: this.estimateTokens(prompt + text),
            provider: this.providerName,
            model
          };
        }
      } catch (e) {
        console.warn('Gemini request failed, fallback engaged', e);
      }
    }
    return {
      text: prompt.includes('JSON') || options?.jsonMode ? '{}' : 'Generated content from Gemini',
      tokensUsed: this.estimateTokens(prompt) + 120,
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
