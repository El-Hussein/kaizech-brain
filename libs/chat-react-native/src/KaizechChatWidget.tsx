import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  StyleSheet,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { KaizechChatScreen, KaizechChatScreenProps } from './KaizechChatScreen';
import { CuteRobotIcon } from './CuteRobotIcon';

export interface KaizechChatWidgetProps extends KaizechChatScreenProps {
  position?: 'bottom-right' | 'bottom-left';
  tooltipDurationMs?: number;
}

export const KaizechChatWidget: React.FC<KaizechChatWidgetProps> = (props) => {
  const {
    theme,
    position = props.theme?.position || 'bottom-right',
    tooltipDurationMs = 3000,
    mode = props.theme?.mode || 'dark',
    botImage = props.theme?.botAvatarUrl,
    primaryColor = props.theme?.primaryColor || '#04cd1c',
    botTitle = props.theme?.botTitle || 'Mrkoon AI Support',
    welcomeMessage = props.theme?.welcomeMessage || 'Hello! Welcome to Mrkoon. How can I help you today?',
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const robotBounce = useRef(new Animated.Value(1)).current;

  const isLeft = position === 'bottom-left';
  const isDark = mode === 'dark';

  useEffect(() => {
    // Fade in tooltip bubble
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Robot gentle pulse animation
    Animated.sequence([
      Animated.timing(robotBounce, { toValue: 1.12, duration: 250, useNativeDriver: true }),
      Animated.timing(robotBounce, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss tooltip after tooltipDurationMs (default 3 seconds)
    const timer = setTimeout(() => {
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setShowTooltip(false);
      });
    }, tooltipDurationMs);

    return () => clearTimeout(timer);
  }, []);

  const handleOpen = () => {
    setShowTooltip(false);
    setIsOpen(true);
  };

  const renderLauncherAvatar = (size: number) => {
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

  return (
    <>
      {/* Floating Robot Widget Container */}
      <View
        style={[
          styles.fabWrapper,
          isLeft ? { left: 20 } : { right: 20 },
        ]}
        pointerEvents="box-none"
      >
        {/* Animated Welcome Tooltip Bubble (Disappears after 3s) */}
        {showTooltip && (
          <Animated.View
            style={[
              styles.tooltipContainer,
              isLeft ? styles.tooltipLeft : styles.tooltipRight,
              { opacity: tooltipOpacity, backgroundColor: isDark ? '#161828' : '#FFFFFF' },
            ]}
          >
            <Text style={[styles.tooltipText, { color: isDark ? '#E8EAFF' : '#1E293B' }]}>{welcomeMessage}</Text>
          </Animated.View>
        )}

        {/* Floating Robot Button */}
        <Animated.View style={{ transform: [{ scale: robotBounce }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpen}
            style={[styles.fabButton, { backgroundColor: primaryColor }]}
            accessibilityLabel="Open AI Support Chat"
            accessibilityRole="button"
          >
            {renderLauncherAvatar(40)}
            <View style={styles.onlineBadge} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Embedded Full Modal Chat Screen */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent={false}
      >
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#0D0F1C' : '#F8FAFC' }]}>
          {/* Single Top Bar with Close Button */}
          <View style={[styles.topCloseBar, { backgroundColor: isDark ? '#161828' : '#FFFFFF' }]}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.miniAvatar, { backgroundColor: primaryColor + '20' }]}>
                {renderLauncherAvatar(26)}
              </View>
              <View>
                <Text style={[styles.topTitle, { color: isDark ? '#E8EAFF' : '#111827' }]}>
                  {botTitle}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.greenDot, { backgroundColor: primaryColor }]} />
                  <Text style={[styles.statusText, { color: primaryColor }]}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6' }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.closeIconText, { color: isDark ? '#6B6F9A' : '#6B7280' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Screen (hideHeader=true to eliminate duplicate headers) */}
          <KaizechChatScreen hideHeader={true} {...props} />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabWrapper: {
    position: 'absolute',
    bottom: 30,
    zIndex: 99999,
    alignItems: 'center',
    flexDirection: 'row',
  },
  tooltipContainer: {
    position: 'absolute',
    bottom: 10,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  tooltipRight: {
    right: 76,
  },
  tooltipLeft: {
    left: 76,
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00E5C3',
    borderWidth: 2,
    borderColor: '#0D0F1C',
  },
  modalContent: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topCloseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
