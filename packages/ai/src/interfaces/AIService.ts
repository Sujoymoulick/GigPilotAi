export interface AIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
}

export interface AIGenerateResult {
  text: string;
  tokensUsed: number;
  provider: string;
  model: string;
}

export interface AIService {
  providerName: string;
  generate(prompt: string, options?: AIServiceOptions): Promise<AIGenerateResult>;
  stream(prompt: string, onChunk: (chunk: string) => void, options?: AIServiceOptions): Promise<AIGenerateResult>;
  estimateTokens(prompt: string): number;
  moderate(text: string): Promise<{ flagged: boolean; reason?: string }>;
}
