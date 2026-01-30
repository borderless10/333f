/**
 * Modal que exibe o widget Pluggy Connect (react-native-pluggy-connect).
 * Usado apenas em iOS/Android; na web usa-se pluggy-connect-modal.web.tsx.
 */

import { PluggyConnect } from 'react-native-pluggy-connect';
import React from 'react';
import { Modal, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface PluggySuccessData {
  itemId: string;
  connectorName: string;
  connectorId: number;
}

interface PluggyConnectModalProps {
  visible: boolean;
  connectToken: string | null;
  onClose: () => void;
  onSuccess: (data: PluggySuccessData) => void;
  onError?: (message: string) => void;
}

export function PluggyConnectModal({
  visible,
  connectToken,
  onClose,
  onSuccess,
  onError,
}: PluggyConnectModalProps) {
  const insets = useSafeAreaInsets();

  const includeSandbox = process.env.EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX !== 'false';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 48 : 24),
          },
        ]}>
        {connectToken ? (
          <View style={styles.widget}>
            <PluggyConnect
              connectToken={connectToken}
              language="pt"
              theme="light"
              includeSandbox={includeSandbox}
              countries={['BR']}
              onSuccess={({ item }) => {
                const connectorName = item?.connector?.name ?? 'Conta Pluggy';
                const connectorId = item?.connector?.id ?? 0;
                onSuccess({
                  itemId: item?.id ?? '',
                  connectorName,
                  connectorId,
                });
                onClose();
              }}
              onError={({ message }) => {
                onError?.(message);
              }}
              onClose={onClose}
            />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  widget: {
    flex: 1,
  },
});
