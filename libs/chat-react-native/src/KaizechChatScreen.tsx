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
  Image,
} from 'react-native';
import {
  KaizechChatEngine,
  ChatEngineConfig,
  ChatState,
  ChatMessage,
} from './core';
import { CuteRobotIcon } from './CuteRobotIcon';

export interface KaizechChatScreenProps extends ChatEngineConfig {
  /** Custom image URL for the bot avatar/icon */
  botImage?: string;
  /** Primary brand accent color (e.g. '#04cd1c') */
  primaryColor?: string;
  /** Custom container background color */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom user message bubble background */
  userBubbleBg?: string;
  /** Custom user message bubble text color */
  userBubbleText?: string;
  /** Custom assistant message bubble background */
  assistantBubbleBg?: string;
  /** Custom assistant message bubble text color */
  assistantBubbleText?: string;
  /** Custom bot header title */
  botTitle?: string;
  /** Custom welcome message text */
  welcomeMessage?: string;
  /** Custom input placeholder text */
  placeholderText?: string;
  /** List of suggested question chips */
  suggestedQuestions?: string[];
  /** Color theme mode: 'dark' (default) or 'light' */
  mode?: 'dark' | 'light';
  /** Set to true to hide the top internal header bar */
  hideHeader?: boolean;
  style?: any;
}

export const KaizechChatScreen: React.FC<KaizechChatScreenProps> = ({
  apiUrl,
  apiKey,
  sessionId,
  theme,
  userMetadata,
  storage,
  botImage = theme?.botAvatarUrl,
  primaryColor = theme?.primaryColor || '#04cd1c',
  backgroundColor = theme?.backgroundColor,
  textColor = theme?.textColor,
  userBubbleBg = theme?.userBubbleBg,
  userBubbleText = theme?.userBubbleText,
  assistantBubbleBg = theme?.assistantBubbleBg,
  assistantBubbleText = theme?.assistantBubbleText,
  botTitle = theme?.botTitle || 'Mrkoon AI Support',
  welcomeMessage = theme?.welcomeMessage,
  placeholderText = theme?.placeholderText || 'Ask me anything…',
  suggestedQuestions = theme?.suggestedQuestions || [],
  mode = theme?.mode || 'dark',
  hideHeader = false,
  style,
}) => {
  const engine = useMemo(() => {
    return new KaizechChatEngine({
      apiUrl,
      apiKey,
      sessionId,
      theme: {
        ...theme,
        primaryColor,
        botTitle,
        welcomeMessage,
        placeholderText,
        suggestedQuestions,
        botAvatarUrl: botImage,
      },
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

  const isDark = mode === 'dark';

  const colors = {
    bg: backgroundColor || (isDark ? '#0D0F1C' : '#F8FAFC'),
    headerBg: isDark ? '#161828' : '#FFFFFF',
    headerTitle: textColor || (isDark ? '#E8EAFF' : '#111827'),
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB',
    userBubbleBg: userBubbleBg || primaryColor,
    userBubbleText: userBubbleText || '#FFFFFF',
    assistantBubbleBg: assistantBubbleBg || (isDark ? '#161828' : '#F1F5F9'),
    assistantBubbleText: assistantBubbleText || (isDark ? '#E8EAFF' : '#1E293B'),
    inputBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9',
    inputText: isDark ? '#E8EAFF' : '#0F172A',
    placeholder: isDark ? '#6B6F9A' : '#94A3B8',
    mutedText: isDark ? '#6B6F9A' : '#64748B',
  };

  const renderBotAvatar = (size: number) => {
    if (botImage) {
      return (
        <Image
          source={{ uri: botImage }}
          style={{ width: size, height: size, borderRadius: size / 2, resizeMode: 'cover' }}
        />
      );
    }
    return <CuteRobotIcon size={size} />;
  };

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
        {!isUser && <View style={styles.msgAvatarWrapper}>{renderBotAvatar(24)}</View>}
        <View
          style={[
            styles.messageBubble,
            isUser
              ? [styles.userBubble, { backgroundColor: colors.userBubbleBg }]
              : [styles.assistantBubble, { backgroundColor: colors.assistantBubbleBg, borderColor: colors.border }],
          ]}
        >
          <Text style={[styles.messageText, { color: isUser ? colors.userBubbleText : colors.assistantBubbleText }]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.bg }, style]}
    >
      {/* Internal Header */}
      {!hideHeader && (
        <View style={[styles.header, { backgroundColor: colors.headerBg, borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatarWrapper, { backgroundColor: primaryColor + '20' }]}>
              {renderBotAvatar(32)}
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.headerTitle }]}>{botTitle}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.onlineDot, { backgroundColor: primaryColor }]} />
                <Text style={[styles.headerSubtitle, { color: primaryColor }]}>Online</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Message List */}
      <FlatList
        data={state.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.welcomeContainer}>
            {renderBotAvatar(54)}
            <Text style={[styles.welcomeTitle, { color: colors.headerTitle }]}>Hey there! 👋</Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedText }]}>
              {welcomeMessage || "I'm your AI assistant. Ask me anything — I'm here to help!"}
            </Text>
          </View>
        }
        ListFooterComponent={
          state.isTyping || state.isStreaming ? (
            <View style={styles.msgRowAssistant}>
              <View style={styles.msgAvatarWrapper}>{renderBotAvatar(24)}</View>
              <View style={[styles.typingBubble, { backgroundColor: colors.assistantBubbleBg, borderColor: colors.border }]}>
                <ActivityIndicator size="small" color={primaryColor} />
                <Text style={[styles.typingText, { color: primaryColor }]}>AI is thinking...</Text>
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
                style={[styles.chip, { borderColor: primaryColor + '60', backgroundColor: primaryColor + '15' }]}
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
      <View style={[styles.inputContainer, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.inputText }]}
          value={input}
          onChangeText={setInput}
          placeholder={placeholderText}
          placeholderTextColor={colors.placeholder}
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
      <View style={[styles.footer, { backgroundColor: colors.headerBg, borderTopColor: colors.border }]}>
        <Text style={[styles.footerText, { color: colors.mutedText }]}>Powered by Kaizech Brain AI ✦</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
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
  },
  headerSubtitle: {
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
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 13,
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
  msgAvatarWrapper: {
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
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
  },
  suggestionsContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionsScroll: {
    gap: 8,
  },
  chip: {
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
    borderTopWidth: 1,
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 14,
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
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 10,
  },
});
