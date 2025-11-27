import type { ChatMessage } from '../types/chat';
import { createDefaultResponseHandler } from '../modules/GPTResponseHandler';
import { taskIngestor } from '../modules/TaskIngestor';
import { createGPTClient, type GPTClient } from './GPTClient';

export class ChatOrchestrator {
  constructor(private readonly gptClient: GPTClient, private readonly responseHandler = createDefaultResponseHandler({ taskIngestor })) {}

  async handleUserMessage(input: string): Promise<ChatMessage[]> {
    const rawResponse = await this.gptClient.sendMessage(input);
    const parsed = await this.responseHandler.handle(rawResponse);

    switch (parsed.kind) {
      case 'userReply':
        return [this.toAssistantMessage(parsed.text)];
      case 'systemForwarded':
        return [
          {
            id: `system-${Date.now()}`,
            author: 'system',
            content: `Captured task and forwarded to ${parsed.target}:\n${parsed.payload}`,
            createdAt: Date.now(),
          },
        ];
      default:
        return [
          {
            id: `assistant-${Date.now()}`,
            author: 'assistant',
            content: parsed.raw ?? 'I was unable to understand that response.',
            createdAt: Date.now(),
          },
        ];
    }
  }

  private toAssistantMessage(text: string): ChatMessage {
    return {
      id: `assistant-${Date.now()}`,
      author: 'assistant',
      content: text,
      createdAt: Date.now(),
    };
  }
}

export const createChatOrchestrator = (deps?: { gptClient?: GPTClient }) => new ChatOrchestrator(deps?.gptClient ?? createGPTClient());

