/**
 * Fallback web: react-native-pluggy-connect não suporta web.
 * Abre o Pluggy Connect em nova aba; usuário pode fechar e atualizar a lista.
 */

import { getPluggyConnectUrl } from '@/lib/services/pluggy';
import React from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
}: PluggyConnectModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const openPluggy = () => {
    if (connectToken) {
      const url = getPluggyConnectUrl(connectToken);
      Linking.openURL(url);
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} transparent>
      <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.card}>
          <Text style={styles.title}>Conectar conta</Text>
          <Text style={styles.text}>
            No navegador, a conexão Pluggy abre em uma nova aba. Conclua o fluxo lá e, ao terminar, feche a aba e volte aqui para atualizar a lista.
          </Text>
          <TouchableOpacity style={styles.button} onPress={openPluggy} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Abrir Pluggy Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111',
  },
  text: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#00b09b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
  },
});
