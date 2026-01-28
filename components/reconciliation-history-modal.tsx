import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import {
  getReconciliationsWithDetails,
  removeReconciliation,
  type ReconciliationWithDetails,
} from '@/lib/services/reconciliation';
import { formatCurrency } from '@/lib/utils/currency';

interface ReconciliationHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function ReconciliationHistoryModal({
  visible,
  onClose,
  onUpdate,
}: ReconciliationHistoryModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [reconciliations, setReconciliations] = useState<ReconciliationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && userId) {
      loadHistory();
    } else {
      // Resetar ao fechar
      setReconciliations([]);
    }
  }, [visible, userId]);

  const loadHistory = async () => {
    if (!userId || !visible) return;

    try {
      setLoading(true);
      const data = await getReconciliationsWithDetails(userId, 50);
      // Verificar se ainda está visível antes de atualizar estado
      if (visible) {
        setReconciliations(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
      if (visible) {
        // Verificar se é erro de tabela não encontrada
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
          showError('Tabela de conciliações não encontrada. Execute o script SQL de setup.');
        } else {
          showError('Não foi possível carregar o histórico');
        }
        setReconciliations([]);
      }
    } finally {
      if (visible) {
        setLoading(false);
      }
    }
  };

  const handleUndo = async (reconciliation: ReconciliationWithDetails) => {
    if (!reconciliation.id) return;

    Alert.alert(
      'Desfazer Conciliação',
      `Deseja desfazer a conciliação entre "${reconciliation.transacao?.descricao || 'Transação'}" e "${reconciliation.titulo?.fornecedor_cliente || 'Título'}"?`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            // Não fazer nada
          }
        },
        {
          text: 'Desfazer',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeReconciliation(reconciliation.id!);
              
              if (visible) {
                showSuccess('Conciliação desfeita com sucesso', {
                  iconType: 'reconciliation',
                });
                
                // Recarregar histórico
                await loadHistory();
                onUpdate?.();
              }
            } catch (error: any) {
              console.error('Erro ao desfazer conciliação:', error);
              if (visible) {
                showError(error.message || 'Não foi possível desfazer a conciliação');
              }
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'conciliado' ? '#10B981' : '#F59E0B';
  };

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
            <ThemedText type="title" style={styles.modalTitle}>
              Histórico de Conciliações
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00b09b" />
              <ThemedText style={styles.loadingText}>Carregando histórico...</ThemedText>
            </View>
          ) : reconciliations.length === 0 ? (
            <GlassContainer style={styles.emptyState}>
              <IconSymbol name="clock.arrow.circlepath" size={48} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.emptyStateText}>Nenhuma conciliação encontrada</ThemedText>
              <ThemedText style={styles.emptyStateSubtext}>
                As conciliações realizadas aparecerão aqui
              </ThemedText>
            </GlassContainer>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              {reconciliations.map((rec) => (
                <GlassContainer key={rec.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyLeft}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(rec.status)}20` },
                        ]}>
                        <Text style={[styles.statusText, { color: getStatusColor(rec.status) }]}>
                          {rec.status === 'conciliado' ? 'Conciliado' : 'Com Diferença'}
                        </Text>
                      </View>
                      <ThemedText style={styles.historyDate}>
                        {formatDateTime(rec.data_conciliacao)}
                      </ThemedText>
                    </View>
                    <TouchableOpacity
                      style={styles.undoButton}
                      onPress={() => handleUndo(rec)}
                      activeOpacity={0.7}>
                      <IconSymbol name="arrow.counterclockwise" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.historyContent}>
                    <View style={styles.historyRow}>
                      <View style={styles.historyItem}>
                        <ThemedText style={styles.historyLabel}>Transação:</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.historyValue}>
                          {rec.transacao?.descricao || 'N/A'}
                        </ThemedText>
                        <ThemedText style={styles.historyMeta}>
                          {rec.transacao ? formatCurrency(rec.transacao.valor) : ''} •{' '}
                          {rec.transacao ? formatDate(rec.transacao.data) : ''}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.historyRow}>
                      <View style={styles.historyItem}>
                        <ThemedText style={styles.historyLabel}>Título:</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.historyValue}>
                          {rec.titulo?.fornecedor_cliente || 'N/A'}
                        </ThemedText>
                        <ThemedText style={styles.historyMeta}>
                          {rec.titulo ? formatCurrency(rec.titulo.valor) : ''} •{' '}
                          {rec.titulo ? formatDate(rec.titulo.data_vencimento) : ''}
                        </ThemedText>
                      </View>
                    </View>

                    {(rec.diferenca_valor > 0 || rec.diferenca_dias > 0) && (
                      <View style={styles.diffContainer}>
                        <IconSymbol name="exclamationmark.triangle.fill" size={14} color="#F59E0B" />
                        <Text style={styles.diffText}>
                          Diferença: {formatCurrency(rec.diferenca_valor)} | {rec.diferenca_dias} dia(s)
                        </Text>
                      </View>
                    )}
                  </View>
                </GlassContainer>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    margin: 16,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyLeft: {
    flex: 1,
    gap: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  undoButton: {
    padding: 6,
  },
  historyContent: {
    gap: 12,
  },
  historyRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyItem: {
    gap: 4,
  },
  historyLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyValue: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  historyMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  diffText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});
