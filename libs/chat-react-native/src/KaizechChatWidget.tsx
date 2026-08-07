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
} from 'react-native';
import { KaizechChatScreen, KaizechChatScreenProps } from './KaizechChatScreen';

export interface KaizechChatWidgetProps extends KaizechChatScreenProps {
  /**
   * Optional custom position override. Defaults to 'bottom-right'.
   */
  position?: 'bottom-right' | 'bottom-left';
  /**
   * Duration in ms to display the welcome tooltip next to the robot. Defaults to 3000ms.
   */
  tooltipDurationMs?: number;
}

export const KaizechChatWidget: React.FC<KaizechChatWidgetProps> = (props) => {
  const {
    theme,
    position = theme?.position || 'bottom-right',
    tooltipDurationMs = 3000,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const robotBounce = useRef(new Animated.Value(1)).current;

  const primaryColor = theme?.primaryColor || '#5B5FEF';
  const welcomeText = theme?.welcomeMessage || 'Hello! How can I help you today?';
  const isLeft = position === 'bottom-left';

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
              { opacity: tooltipOpacity },
            ]}
          >
            <Text style={styles.tooltipText}>{welcomeText}</Text>
          </Animated.View>
        )}

        {/* Cute Robot Floating Button */}
        <Animated.View style={{ transform: [{ scale: robotBounce }] }}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleOpen}
            style={[styles.fabButton, { backgroundColor: primaryColor }]}
            accessibilityLabel="Open AI Support Chat"
            accessibilityRole="button"
          >
            <View style={styles.robotFace}>
              <Text style={{ fontSize: 28 }}>🤖</Text>
            </View>
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
        <View style={styles.modalContent}>
          {/* Top Bar with Close Button */}
          <View style={styles.topCloseBar}>
            <View style={styles.headerTitleGroup}>
              <View style={[styles.miniAvatar, { backgroundColor: primaryColor }]}>
                <Text style={{ fontSize: 18 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.topTitle}>{theme?.botTitle || 'Mrkoon AI Support'}</Text>
                <View style={styles.statusRow}>
                  <View style={styles.greenDot} />
                  <Text style={styles.statusText}>Online</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsOpen(false)}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Screen Component */}
          <KaizechChatScreen {...props} />
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
    backgroundColor: '#161828',
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
    color: '#E8EAFF',
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
    shadowColor: '#5B5FEF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 10,
  },
  robotFace: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#0D0F1C',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topCloseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161828',
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
    color: '#E8EAFF',
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
    backgroundColor: '#00E5C3',
  },
  statusText: {
    color: '#00E5C3',
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIconText: {
    color: '#6B6F9A',
    fontSize: 14,
    fontWeight: '600',
  },
});
