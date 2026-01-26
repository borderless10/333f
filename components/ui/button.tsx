import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { ThemedText } from '../themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading, style, disabled, ...props }: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary };
      case 'secondary':
        return { backgroundColor: colors.surfaceSecondary };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.primary };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return colors.primary;
    if (variant === 'secondary') return colors.text;
    return '#FFFFFF';
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyle(), (disabled || loading) && styles.disabled, style]}
      disabled={disabled || loading}
      {...props}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <ThemedText 
          style={[styles.text, { color: getTextColor() }]} 
          type="defaultSemiBold"
          numberOfLines={0}>
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});





