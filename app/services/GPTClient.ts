import { defaultGPTConfig, type GPTConfig } from '../config/gpt';

export interface GPTClient {
  sendMessage(prompt: string): Promise<string>;
}

class OpenAIClient implements GPTClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(config: GPTConfig = defaultGPTConfig) {
    this.apiKey = config.apiKey ?? defaultGPTConfig.apiKey;
    this.baseUrl = config.baseUrl ?? defaultGPTConfig.baseUrl;
    this.model = config.model ?? defaultGPTConfig.model;
  }

  async sendMessage(prompt: string): Promise<string> {
    if (!this.apiKey) {
      console.warn('Missing OpenAI API key. Falling back to mock response.');
      return `Echo: ${prompt}`;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are PAgent, a proactive personal assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.text();
      throw new Error(errorPayload);
    }

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content ?? '';
  }
}

class MockGPTClient implements GPTClient {
  async sendMessage(prompt: string): Promise<string> {
    return `[USR]Mocked response for: ${prompt}`;
  }
}

export const createGPTClient = (config?: GPTConfig, options?: { useMock?: boolean }): GPTClient => {
  if (options?.useMock) {
    return new MockGPTClient();
  }

  return new OpenAIClient(config);
};

