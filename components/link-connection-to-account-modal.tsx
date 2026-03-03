/**
 * Modal para vincular uma conta bancária manual a uma conexão Open Finance
 * Fluxo inverso do LinkAccountModal: seleciona a conexão para vincular à conta
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import Toast from 'react-native-toast-message';
import { toastConfig } from './NotificationToast';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { getUserConnections, updateConnection, type OpenFinanceConnection } from '@/lib/services/open-finance';
import { getBankByCode } from '@/lib/services/bank-integrations';
import type { ContaBancaria } from '@/lib/contas';

interface LinkConnectionToAccountModalProps {
  visible: boolean;
  account: ContaBancaria | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LinkConnectionToAccountModal({
  visible,
  account,
  onClose,
  onSuccess,
}: LinkConnectionToAccountModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadConnections();
    }
    if (!visible) {
      setSelectedConnectionId(null);
    }
  }, [visible, userId]);

  useEffect(() => {
    // Pré-selecionar conexão já vinculada a esta conta
    if (account?.id && connections.length > 0) {
      const linked = connections.find((c) => c.conta_bancaria_id === account.id);
      setSelectedConnectionId(linked?.id ?? null);
    } else {
      setSelectedConnectionId(null);
    }
  }, [account?.id, connections]);

  const loadConnections = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await getUserConnections(userId);
      setConnections(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar conexões:', error);
      showError('Não foi possível carregar as conexões');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!account || !selectedConnectionId) return;

    try {
      setLinking(true);

      await updateConnection(selectedConnectionId, {
        conta_bancaria_id: account.id!,
      });

      const conn = connections.find((c) => c.id === selectedConnectionId);
      const bankName = conn ? getBankByCode(conn.bank_code)?.name || conn.bank_name : 'conexão';

      showSuccess(`Conta vinculada a ${bankName}`, {
        iconType: 'link',
        title: account.descricao,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao vincular conta:', error);
      showError(error.message || 'Não foi possível vincular a conexão');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!account || !selectedConnectionId) return;

    const conn = connections.find((c) => c.id === selectedConnectionId);
    if (!conn || conn.conta_bancaria_id !== account.id) {
      showError('Selecione a conexão vinculada para desvincular');
      return;
    }

    try {
      setUnlinking(true);

      await updateConnection(selectedConnectionId, {
        conta_bancaria_id: null,
      });

      showSuccess('Conexão desvinculada com sucesso', {
        iconType: 'link',
        title: account.descricao,
      });

      setSelectedConnectionId(null);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao desvincular:', error);
      showError(error.message || 'Não foi possível desvincular');
    } finally {
      setUnlinking(false);
    }
  };

  if (!account) return null;

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);
  const canUnlink = selectedConnection?.conta_bancaria_id === account.id;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
          <AnimatedBackground />

          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <IconSymbol name="link.circle.fill" size={32} color="#00b09b" />
              <View style={styles.headerText}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Vincular Open Finance
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {account.descricao}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>

            <GlassContainer style={styles.infoBox}>
              <IconSymbol name="info.circle.fill" size={20} color="#6366F1" />
              <ThemedText style={styles.infoText}>
                Vincule uma conexão Open Finance a esta conta para importar
                transações e saldo diretamente para ela.
              </ThemedText>
            </GlassContainer>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00b09b" />
                <ThemedText style={styles.loadingText}>Carregando conexões...</ThemedText>
              </View>
            ) : connections.length === 0 ? (
              <GlassContainer style={styles.emptyState}>
                <IconSymbol name="link.circle" size={48} color="rgba(255, 255, 255, 0.5)" />
                <ThemedText style={styles.emptyStateText}>
                  Nenhuma conexão Open Finance
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Conecte sua conta bancária em Open Finance primeiro
                </ThemedText>
              </GlassContainer>
            ) : (
              <>
                <ThemedText style={styles.sectionTitle}>
                  Selecione a conexão para vincular
                </ThemedText>

                <View style={styles.connectionsList}>
                  {connections.map((conn) => {
                    const isSelected = selectedConnectionId === conn.id;
                    const isLinkedToThisAccount = conn.conta_bancaria_id === account.id;
                    const isLinkedToOther = conn.conta_bancaria_id != null && conn.conta_bancaria_id !== account.id;
                    const bankName = getBankByCode(conn.bank_code)?.name || conn.bank_name;
                    const accountType = conn.account_type === 'checking' ? 'Conta Corrente' :
                      conn.account_type === 'savings' ? 'Poupança' : 'Investimento';

                    return (
                      <TouchableOpacity
                        key={conn.id}
                        onPress={() => setSelectedConnectionId(conn.id)}
                        activeOpacity={0.7}
                        style={[
                          styles.connectionItem,
                          isSelected && styles.connectionItemSelected,
                        ]}>
                        <View style={styles.connectionItemLeft}>
                          <View style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                            {isSelected && (
                              <View style={styles.radioCircleInner} />
                            )}
                          </View>
                          <View style={styles.connectionItemInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.connectionBank}>
                              {bankName}
                            </ThemedText>
                            <ThemedText style={styles.connectionDetails}>
                              {accountType} • {conn.account_number}
                            </ThemedText>
                          </View>
                        </View>
                        {isLinkedToThisAccount && (
                          <View style={styles.linkedBadge}>
                            <Text style={styles.linkedBadgeText}>Vinculada</Text>
                          </View>
                        )}
                        {isLinkedToOther && (
                          <View style={styles.otherBadge}>
                            <Text style={styles.otherBadgeText}>Outra conta</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            {canUnlink && (
              <Button
                title={unlinking ? 'Desvinculando...' : 'Desvincular'}
                onPress={handleUnlink}
                disabled={unlinking || linking}
                variant="outline"
                style={styles.unlinkButton}
              />
            )}
            <Button
              title={linking ? 'Vinculando...' : 'Vincular'}
              onPress={handleLink}
              disabled={!selectedConnectionId || loading || linking || unlinking}
              style={styles.linkButton}
            />
            <Button
              title="Cancelar"
              onPress={onClose}
              disabled={loading || linking || unlinking}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </View>
      <Toast config={toastConfig} topOffset={60} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  connectionsList: {
    gap: 12,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  connectionItemSelected: {
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderColor: '#00b09b',
  },
  connectionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00b09b',
  },
  radioCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00b09b',
  },
  connectionItemInfo: {
    flex: 1,
  },
  connectionBank: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  connectionDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  linkedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
  },
  linkedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00b09b',
  },
  otherBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  otherBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FBBF24',
  },
  modalActions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  linkButton: {
    backgroundColor: '#00b09b',
  },
  unlinkButton: {
    borderColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
