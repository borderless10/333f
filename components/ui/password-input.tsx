import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '../themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export type PasswordInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function PasswordInput({ label, error, style, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={[styles.label, { color: '#FFFFFF' }]} type="defaultSemiBold">
          {label}
        </ThemedText>
      )}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: error ? colors.danger : 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
            },
            style,
          ]}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          secureTextEntry={!showPassword}
          {...props}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
          activeOpacity={0.7}>
          <MaterialIcons
            name={showPassword ? 'visibility' : 'visibility-off'}
            size={20}
            color="rgba(255, 255, 255, 0.7)"
          />
        </TouchableOpacity>
      </View>
      {error && (
        <ThemedText style={[styles.error, { color: colors.danger }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});

