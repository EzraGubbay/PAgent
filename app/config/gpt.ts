export interface GPTConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export const defaultGPTConfig: Required<GPTConfig> = {
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '',
  baseUrl: process.env.EXPO_PUBLIC_OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  model: process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4o-mini',
};

