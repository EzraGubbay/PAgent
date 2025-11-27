export type ChatAuthor = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  author: ChatAuthor;
  content: string;
  createdAt: number;
  status?: 'sending' | 'sent' | 'error';
}

