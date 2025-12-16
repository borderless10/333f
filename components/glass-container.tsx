import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';

interface GlassContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GlassContainer({ children, style }: GlassContainerProps) {
  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    backgroundColor: Platform.select({
      ios: 'rgba(0, 21, 42, 0.3)',
      android: 'rgba(0, 21, 42, 0.4)',
      web: 'rgba(0, 21, 42, 0.4)',
      default: 'rgba(0, 21, 42, 0.4)',
    }),
    ...(Platform.OS === 'web' && {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    }),
  },
});

