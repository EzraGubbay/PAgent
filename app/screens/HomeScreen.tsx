import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import Composer from '../components/Composer';
import MessageBubble from '../components/MessageBubble';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types/chat';
import { createChatOrchestrator } from '../services/ChatOrchestrator';

const initialMessage: ChatMessage = {
  id: 'assistant-welcome',
  author: 'assistant',
  content: 'Hey! I am PAgent. Tell me what you need and I will take it from there.',
  createdAt: Date.now(),
};

const HomeScreen = () => {
  const orchestrator = useMemo(() => createChatOrchestrator(), []);
  const { messages, sendMessage, isSending, error } = useChat({
    initialMessages: [initialMessage],
    sendToAssistant: (input) => orchestrator.handleUserMessage(input),
  });

  const sortedMessages = useMemo(() => [...messages].sort((a, b) => a.createdAt - b.createdAt), [messages]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>PAgent</Text>
        <Text style={styles.subtitle}>Personal AI Assistant</Text>
      </View>

      <FlatList
        data={sortedMessages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        style={styles.list}
        ListFooterComponent={isSending ? <Text style={styles.typing}>PAgent is typing…</Text> : null}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Composer onSend={sendMessage} disabled={isSending} />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: 12,
    gap: 4,
  },
  typing: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#94a3b8',
    fontSize: 13,
  },
  error: {
    color: '#f87171',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});

