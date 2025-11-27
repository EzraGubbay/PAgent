import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage } from '../types/chat';

interface Props {
  message: ChatMessage;
}

const MessageBubble = memo(({ message }: Props) => {
  const isUser = message.author === 'user';
  const bubbleStyle = isUser ? styles.userBubble : styles.agentBubble;
  const textStyle = isUser ? styles.userText : styles.agentText;

  return (
    <View style={[styles.container, isUser ? styles.containerRight : styles.containerLeft]}>
      <View style={[styles.bubble, bubbleStyle]}>
        <Text style={[styles.text, textStyle]}>{message.content}</Text>
      </View>
    </View>
  );
});

export default MessageBubble;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: '100%',
  },
  containerRight: {
    alignItems: 'flex-end',
  },
  containerLeft: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#34d399',
  },
  agentBubble: {
    backgroundColor: '#1e293b',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#052e16',
  },
  agentText: {
    color: '#f8fafc',
  },
});

