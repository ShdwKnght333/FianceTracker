import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

let BlurView: any = null;
try {
  BlurView = require('expo-blur').BlurView;
} catch (e) {
  // expo-blur not available
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassCard({ children, style, intensity = 40, tint = 'dark' }: GlassCardProps) {
  const useBlur = BlurView && Platform.OS === 'ios';

  return (
    <View style={[styles.container, style]}>
      {useBlur ? (
        <BlurView intensity={intensity} tint={tint} style={styles.blur}>
          <View style={styles.content}>
            {children}
          </View>
        </BlurView>
      ) : (
        <View style={[styles.blur, styles.fallbackBg]}>
          <View style={styles.content}>
            {children}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  blur: {
    overflow: 'hidden',
  },
  fallbackBg: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  content: {
    padding: 20,
  },
});
