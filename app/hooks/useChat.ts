import { useCallback, useMemo, useState } from 'react';
import type { ChatMessage } from '../types/chat';

type AssistantResponse = ChatMessage | ChatMessage[] | void;

interface UseChatOptions {
  initialMessages?: ChatMessage[];
  sendToAssistant?: (userInput: string) => Promise<AssistantResponse>;
}

const defaultAssistant = async (text: string): Promise<ChatMessage> => ({
  id: `assistant-${Date.now()}`,
  author: 'assistant',
  content: `Echo: ${text}`,
  createdAt: Date.now(),
});

export const useChat = ({ initialMessages = [], sendToAssistant = defaultAssistant }: UseChatOptions = {}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) {
        return;
      }

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        author: 'user',
        content: trimmed,
        createdAt: Date.now(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsSending(true);
      setError(null);

      try {
        const response = await sendToAssistant(trimmed);
        if (!response) {
          return;
        }

        const nextMessages = Array.isArray(response) ? response : [response];
        setMessages((prev) => [...prev, ...nextMessages]);
      } catch (err) {
        console.error(err);
        setError('Something went wrong. Please try again.');
      } finally {
        setIsSending(false);
      }
    },
    [isSending, sendToAssistant],
  );

  const state = useMemo(
    () => ({
      messages,
      sendMessage,
      isSending,
      error,
    }),
    [messages, sendMessage, isSending, error],
  );

  return state;
};

