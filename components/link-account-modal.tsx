/**
 * Modal para vincular uma conexão Open Finance a uma conta bancária manual
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
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import { updateConnection, type OpenFinanceConnection } from '@/lib/services/open-finance';

interface LinkAccountModalProps {
  visible: boolean;
  connection: OpenFinanceConnection | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LinkAccountModal({
  visible,
  connection,
  onClose,
  onSuccess,
}: LinkAccountModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    if (visible && userId) {
      loadAccounts();
    }
    // Pré-selecionar conta já vinculada
    if (connection?.conta_bancaria_id) {
      setSelectedAccountId(connection.conta_bancaria_id);
    } else {
      setSelectedAccountId(null);
    }
  }, [visible, userId, connection]);

  const loadAccounts = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await buscarContas(userId);
      setContas(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      showError('Não foi possível carregar as contas');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!connection || !selectedAccountId) return;

    try {
      setLoading(true);

      await updateConnection(connection.id, {
        conta_bancaria_id: selectedAccountId,
      });

      const accountName = contas.find((c) => c.id === selectedAccountId)?.descricao || 'conta';
      showSuccess(`Conexão vinculada a ${accountName}`, {
        iconType: 'link',
        title: connection.bank_name,
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao vincular conta:', error);
      showError(error.message || 'Não foi possível vincular a conta');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!connection) return;

    try {
      setUnlinking(true);

      await updateConnection(connection.id, {
        conta_bancaria_id: null,
      });

      showSuccess(`Desvinculada com sucesso`, {
        iconType: 'link',
        title: connection.bank_name,
      });

      setSelectedAccountId(null);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao desvincular conta:', error);
      showError(error.message || 'Não foi possível desvincular a conta');
    } finally {
      setUnlinking(false);
    }
  };

  if (!connection) return null;

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
                  Vincular Conta
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {connection.bank_name}
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
                Vincule esta conexão Open Finance a uma conta bancária manual para importar
                transações diretamente para ela.
              </ThemedText>
            </GlassContainer>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00b09b" />
                <ThemedText style={styles.loadingText}>Carregando contas...</ThemedText>
              </View>
            ) : contas.length === 0 ? (
              <GlassContainer style={styles.emptyState}>
                <IconSymbol name="building.columns" size={48} color="rgba(255, 255, 255, 0.5)" />
                <ThemedText style={styles.emptyStateText}>
                  Nenhuma conta cadastrada
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Cadastre uma conta bancária manual primeiro
                </ThemedText>
              </GlassContainer>
            ) : (
              <>
                <ThemedText style={styles.sectionTitle}>
                  Selecione a conta bancária
                </ThemedText>
                
                <View style={styles.accountsList}>
                  {contas.map((conta) => {
                    const isSelected = selectedAccountId === conta.id;
                    const isCurrentlyLinked = connection.conta_bancaria_id === conta.id;
                    
                    return (
                      <TouchableOpacity
                        key={conta.id}
                        onPress={() => setSelectedAccountId(conta.id!)}
                        activeOpacity={0.7}
                        style={[
                          styles.accountItem,
                          isSelected && styles.accountItemSelected,
                        ]}>
                        <View style={styles.accountItemLeft}>
                          <View style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}>
                            {isSelected && (
                              <View style={styles.radioCircleInner} />
                            )}
                          </View>
                          <View style={styles.accountItemInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.accountName}>
                              {conta.descricao}
                            </ThemedText>
                            <ThemedText style={styles.accountDetails}>
                              Banco: {conta.codigo_banco} • Agência: {conta.codigo_agencia}
                            </ThemedText>
                          </View>
                        </View>
                        {isCurrentlyLinked && (
                          <View style={styles.linkedBadge}>
                            <Text style={styles.linkedBadgeText}>Atual</Text>
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
            {connection.conta_bancaria_id && (
              <Button
                title="Desvincular"
                onPress={handleUnlink}
                disabled={unlinking || loading}
                variant="outline"
                style={styles.unlinkButton}
              />
            )}
            <Button
              title={loading ? 'Vinculando...' : 'Vincular'}
              onPress={handleLink}
              disabled={!selectedAccountId || loading || unlinking}
              style={styles.linkButton}
            />
            <Button
              title="Cancelar"
              onPress={onClose}
              disabled={loading || unlinking}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </View>
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
  accountsList: {
    gap: 12,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountItemSelected: {
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderColor: '#00b09b',
  },
  accountItemLeft: {
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
  accountItemInfo: {
    flex: 1,
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  accountDetails: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  linkedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  linkedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
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
