import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  KaizechChatEngine,
  ChatEngineConfig,
  ChatState,
  ChatMessage,
} from '@husseinsalah96/chat-core';

export interface KaizechChatScreenProps extends ChatEngineConfig {
  style?: any;
}

export const KaizechChatScreen: React.FC<KaizechChatScreenProps> = ({
  apiUrl,
  apiKey,
  sessionId,
  theme,
  userMetadata,
  storage,
  style,
}) => {
  const engine = useMemo(() => {
    return new KaizechChatEngine({
      apiUrl,
      apiKey,
      sessionId,
      theme,
      userMetadata,
      storage,
    });
  }, [apiUrl, apiKey, sessionId]);

  const [state, setState] = useState<ChatState>(() => engine.getState());
  const [input, setInput] = useState('');

  useEffect(() => {
    const unsub = engine.on('state_change', (newState: ChatState) => {
      setState(newState);
    });
    return () => unsub();
  }, [engine]);

  const primaryColor = theme?.primaryColor || '#0066FF';

  const handleSend = () => {
    if (input.trim()) {
      engine.sendMessage(input);
      setInput('');
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? [styles.userBubble, { backgroundColor: primaryColor }] : styles.assistantBubble,
        ]}
      >
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: primaryColor }]}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 18 }}>🤖</Text>
        </View>
        <View>
          <Text style={styles.headerTitle}>{theme?.botTitle || 'AI Assistant'}</Text>
          <Text style={styles.headerSubtitle}>Online</Text>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        data={state.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          state.isTyping || state.isStreaming ? (
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color={primaryColor} />
              <Text style={styles.typingText}>AI is typing...</Text>
            </View>
          ) : null
        }
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={theme?.placeholderText || 'Type your message...'}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: primaryColor }]}
          onPress={handleSend}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  listContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#0F172A',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  typingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 21,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});
