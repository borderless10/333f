import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { createOpenFinanceConnection } from '@/lib/services/open-finance';
import { getPluggyConnectToken } from '@/lib/services/pluggy';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from './animated-background';
import { PluggyConnectModal } from './pluggy-connect-modal';
import { ThemedText } from './themed-text';
import { Button } from './ui/button';
import { IconSymbol } from './ui/icon-symbol';

interface NewConnectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewConnectionModal({ visible, onClose, onSuccess }: NewConnectionModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [pluggyConnectToken, setPluggyConnectToken] = useState<string | null>(null);
  const [showPluggyWidget, setShowPluggyWidget] = useState(false);

  const handleCreateConnection = async () => {
    if (!userId) {
      showError('Faça login para continuar', { iconType: 'link' });
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const result = await getPluggyConnectToken(userId);
      const { connectToken } = result;
      if (!connectToken || connectToken.length < 10) {
        showError('Não foi possível obter o token da Pluggy. Tente de novo.', { iconType: 'link' });
        setLoading(false);
        return;
      }
      setLoading(false);
      handleClose();
      setPluggyConnectToken(connectToken);
      setShowPluggyWidget(true);
    } catch (error: any) {
      console.error('Erro ao criar conexão:', error);
      setLoading(false);
      if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache') || error?.message?.includes('Tabela de conexões')) {
        showError('Tabela de conexões não encontrada. Execute o script SQL de setup no Supabase.', { iconType: 'link' });
      } else {
        showError(error?.message || 'Não foi possível criar a conexão', { iconType: 'link' });
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handlePluggyClose = () => {
    setShowPluggyWidget(false);
    setPluggyConnectToken(null);
  };

  const handlePluggySuccess = async (data: { itemId: string; connectorName: string; connectorId: number }) => {
    if (!userId) return;
    try {
      await createOpenFinanceConnection(userId, {
        bank_code: data.connectorId,
        bank_name: data.connectorName,
        account_number: '',
        account_type: 'checking',
        provider: 'plugg',
        pluggy_item_id: data.itemId,
      });
      handlePluggyClose();
      showSuccess('Conta conectada com sucesso!', { iconType: 'link' });
      onSuccess?.();
      setTimeout(() => router.push('/(tabs)/bank-connections'), 300);
    } catch (err: any) {
      showError(err?.message ?? 'Não foi possível salvar a conexão.', { iconType: 'link' });
    }
  };

  return (
    <>
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
          <AnimatedBackground />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Conectar via Open Finance
              </ThemedText>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <ThemedText style={styles.description}>
                Conecte sua conta bancária com a Pluggy para importar transações e saldos.
              </ThemedText>

              <View style={styles.actions}>
                <Button
                  title={loading ? 'Conectando...' : 'Conectar Conta'}
                  onPress={handleCreateConnection}
                  disabled={loading}
                  style={styles.primaryButton}
                />
                <Button
                  title="Cancelar"
                  onPress={handleClose}
                  variant="outline"
                  style={styles.cancelButton}
                  disabled={loading}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
    <PluggyConnectModal
      visible={showPluggyWidget}
      connectToken={pluggyConnectToken}
      onClose={handlePluggyClose}
      onSuccess={handlePluggySuccess}
      onError={(msg) => showError(msg, { iconType: 'link' })}
    />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    gap: 20,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  providerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  providerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  providerButtonActive: {
    backgroundColor: '#00b09b',
    borderColor: '#00b09b',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  providerButtonTextActive: {
    color: '#FFFFFF',
  },
  banksList: {
    maxHeight: 200,
  },
  bankOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bankOptionActive: {
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    borderColor: '#00b09b',
  },
  bankOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bankOptionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bankOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  accountTypeButtonActive: {
    backgroundColor: '#00b09b',
    borderColor: '#00b09b',
  },
  accountTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  accountTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#00b09b',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
