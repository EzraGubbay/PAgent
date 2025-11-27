import { useCallback, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface Props {
  onSend: (text: string) => Promise<void> | void;
  disabled?: boolean;
}

const Composer = ({ onSend, disabled }: Props) => {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) {
      return;
    }

    setValue('');
    await onSend(trimmed);
  }, [disabled, onSend, value]);

  const Wrapper = Platform.select({
    ios: KeyboardAvoidingView,
    default: View,
  });

  return (
    <Wrapper behavior="padding">
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Message PAgent"
          placeholderTextColor="#94a3b8"
          value={value}
          onChangeText={setValue}
          editable={!disabled}
          multiline
        />
        <Pressable style={[styles.sendButton, disabled ? styles.sendButtonDisabled : null]} onPress={handleSubmit} disabled={disabled}>
          {disabled ? <ActivityIndicator size="small" color="#94a3b8" /> : <Text style={styles.sendLabel}>Send</Text>}
        </Pressable>
      </View>
    </Wrapper>
  );
};

export default Composer;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    color: '#f8fafc',
  },
  sendButton: {
    minWidth: 64,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#34d399',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1f2937',
  },
  sendLabel: {
    fontWeight: '600',
    color: '#052e16',
  },
});

