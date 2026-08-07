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
  ScrollView,
} from 'react-native';
import {
  KaizechChatEngine,
  ChatEngineConfig,
  ChatState,
  ChatMessage,
} from './core';

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

  const primaryColor = theme?.primaryColor || '#5B5FEF';
  const suggestedQuestions = theme?.suggestedQuestions || [];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || input;
    if (text.trim()) {
      engine.sendMessage(text.trim());
      setInput('');
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAssistant]}>
        {!isUser && (
          <View style={[styles.msgAvatar, { backgroundColor: primaryColor }]}>
            <Text style={{ fontSize: 14 }}>🤖</Text>
          </View>
        )}
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
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatar, { backgroundColor: primaryColor }]}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>{theme?.botTitle || 'AI Assistant'}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Online</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Message List */}
      <FlatList
        data={state.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeEmoji}>🤖</Text>
            <Text style={styles.welcomeTitle}>Hey there! 👋</Text>
            <Text style={styles.welcomeSub}>I'm your AI assistant. Ask me anything — I'm here to help!</Text>
          </View>
        }
        ListFooterComponent={
          state.isTyping || state.isStreaming ? (
            <View style={styles.msgRowAssistant}>
              <View style={[styles.msgAvatar, { backgroundColor: primaryColor }]}>
                <Text style={{ fontSize: 14 }}>🤖</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color="#00E5C3" />
                <Text style={styles.typingText}>AI is thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Suggestion Chips */}
      {state.messages.length <= 1 && suggestedQuestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsScroll}>
            {suggestedQuestions.map((q, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.chip, { borderColor: primaryColor }]}
                onPress={() => handleSend(q)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: primaryColor }]}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={theme?.placeholderText || 'Ask me anything…'}
          placeholderTextColor="#6B6F9A"
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: primaryColor }]}
          onPress={() => handleSend()}
          activeOpacity={0.8}
        >
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Branding */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Kaizech Brain AI ✦</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F1C',
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#161828',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  headerTitle: {
    color: '#E8EAFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00E5C3',
  },
  headerSubtitle: {
    color: '#00E5C3',
    fontSize: 11,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8EAFF',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 13,
    color: '#6B6F9A',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  msgRow: {
    marginVertical: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAssistant: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#161828',
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  assistantText: {
    color: '#E8EAFF',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#161828',
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    color: '#00E5C3',
  },
  suggestionsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionsScroll: {
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(91, 95, 239, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#161828',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 14,
    color: '#E8EAFF',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#161828',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  footerText: {
    fontSize: 10,
    color: '#6B6F9A',
  },
});
