import type { AIService, AIServiceOptions, AIGenerateResult } from './interfaces/AIService';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { GeminiProvider } from './providers/GeminiProvider';
import { ClaudeProvider } from './providers/ClaudeProvider';
import { GroqProvider } from './providers/GroqProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';

export type ProviderType = 'openai' | 'gemini' | 'claude' | 'groq' | 'openrouter';

export class AIServiceManager {
  private providers: Map<string, AIService> = new Map();
  private defaultProvider: string = 'openai';

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('claude', new ClaudeProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('openrouter', new OpenRouterProvider());
  }

  public getProvider(name?: ProviderType | string): AIService {
    const key = (name || this.defaultProvider).toLowerCase();
    return this.providers.get(key) || this.providers.get('openai')!;
  }

  public async generate(prompt: string, providerName?: string, options?: AIServiceOptions): Promise<AIGenerateResult> {
    const provider = this.getProvider(providerName);
    return await provider.generate(prompt, options);
  }
}

export const aiManager = new AIServiceManager();
