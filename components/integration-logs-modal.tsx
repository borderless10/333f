import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  getIntegrationLogs,
  type IntegrationLog,
  type IntegrationOperationType,
} from '@/lib/services/open-finance';

interface IntegrationLogsModalProps {
  visible: boolean;
  onClose: () => void;
  connectionId?: string | null;
}

export function IntegrationLogsModal({ visible, onClose, connectionId }: IntegrationLogsModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showError } = useNotification();

  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<IntegrationOperationType | 'all'>('all');

  useEffect(() => {
    if (visible && userId) {
      loadLogs();
    } else {
      // Resetar ao fechar
      setLogs([]);
      setFilterType('all');
      setLoading(true);
    }
  }, [visible, userId, connectionId]);

  useEffect(() => {
    if (visible && userId) {
      loadLogs();
    }
  }, [filterType]);

  const loadLogs = async () => {
    if (!userId || !visible) return;

    try {
      setLoading(true);
      const data = await getIntegrationLogs(userId, {
        connectionId: connectionId || undefined,
        operationType: filterType === 'all' ? undefined : filterType,
        limit: 100,
      });
      // Verificar se ainda está visível antes de atualizar estado
      if (visible) {
        setLogs(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar logs:', error);
      if (visible) {
        // Verificar se é erro de tabela não encontrada
        if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
          showError('Tabela de logs não encontrada. Execute o script SQL de setup.');
        } else {
          showError('Não foi possível carregar os logs');
        }
        setLogs([]);
      }
    } finally {
      if (visible) {
        setLoading(false);
      }
    }
  };

  const getOperationLabel = (type: IntegrationOperationType): string => {
    const labels: Record<IntegrationOperationType, string> = {
      consent_created: 'Consentimento Criado',
      consent_renewed: 'Consentimento Renovado',
      consent_revoked: 'Consentimento Revogado',
      sync_transactions: 'Sincronizar Transações',
      sync_balance: 'Sincronizar Saldo',
      token_refresh: 'Renovar Token',
      error: 'Erro',
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#FBBF24';
      default:
        return '#9CA3AF';
    }
  };

  const operationTypes: (IntegrationOperationType | 'all')[] = [
    'all',
    'consent_created',
    'consent_renewed',
    'consent_revoked',
    'sync_transactions',
    'sync_balance',
    'token_refresh',
    'error',
  ];

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
              Logs de Integração
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filters}>
            {operationTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                onPress={() => setFilterType(type)}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterType === type && styles.filterTextActive,
                  ]}>
                  {type === 'all' ? 'Todos' : getOperationLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Lista de Logs */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00b09b" />
              <ThemedText style={styles.loadingText}>Carregando logs...</ThemedText>
            </View>
          ) : logs.length === 0 ? (
            <GlassContainer style={styles.emptyState}>
              <IconSymbol name="list.bullet" size={48} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.emptyStateText}>Nenhum log encontrado</ThemedText>
            </GlassContainer>
          ) : (
            <ScrollView
              style={styles.logsList}
              contentContainerStyle={styles.logsListContent}
              showsVerticalScrollIndicator={false}>
              {logs.map((log) => (
                <GlassContainer key={log.id} style={styles.logCard}>
                  <View style={styles.logHeader}>
                    <View style={styles.logLeft}>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: `${getStatusColor(log.status)}20` },
                        ]}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(log.status) },
                          ]}
                        />
                      </View>
                      <View style={styles.logInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.logOperation}>
                          {getOperationLabel(log.operation_type)}
                        </ThemedText>
                        <ThemedText style={styles.logDate}>
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </ThemedText>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(log.status)}20` },
                      ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(log.status) }]}>
                        {log.status === 'success' ? 'Sucesso' :
                         log.status === 'error' ? 'Erro' : 'Pendente'}
                      </Text>
                    </View>
                  </View>

                  {log.message && (
                    <ThemedText style={styles.logMessage}>{log.message}</ThemedText>
                  )}

                  {log.error_message && (
                    <View style={styles.errorContainer}>
                      <ThemedText style={styles.errorTitle}>Erro:</ThemedText>
                      <ThemedText style={styles.errorMessage}>{log.error_message}</ThemedText>
                    </View>
                  )}

                  {log.metadata && (
                    <View style={styles.metadataContainer}>
                      <ThemedText style={styles.metadataText}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </ThemedText>
                    </View>
                  )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  filtersContainer: {
    maxHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filters: {
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#00b09b',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  logsList: {
    flex: 1,
  },
  logsListContent: {
    padding: 16,
    gap: 12,
  },
  logCard: {
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  logInfo: {
    flex: 1,
  },
  logOperation: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  logDate: {
    fontSize: 12,
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  logMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 12,
    color: '#EF4444',
  },
  metadataContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  metadataText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
});
