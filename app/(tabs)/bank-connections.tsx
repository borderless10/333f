import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import {
  getUserConnections,
  renewConsent,
  revokeConsent,
  importTransactions,
  importBalance,
  getIntegrationLogs,
  getExpiredConnections,
  isTokenExpired,
  type OpenFinanceConnection,
  type IntegrationLog,
  type ImportedTransaction,
} from '@/lib/services/open-finance';
import { getBankByCode } from '@/lib/services/bank-integrations';
import { NewConnectionModal } from '@/components/new-connection-modal';
import { IntegrationLogsModal } from '@/components/integration-logs-modal';
import { formatCurrency } from '@/lib/utils/currency';

export default function BankConnectionsScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError, showWarning } = useNotification();
  const scrollRef = useScrollToTop();

  const [connections, setConnections] = useState<OpenFinanceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConnectionVisible, setNewConnectionVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<OpenFinanceConnection | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const loadingRef = useRef(false); // Prevenir múltiplas chamadas simultâneas

  useEffect(() => {
    let isMounted = true;

    if (userId) {
      loadConnections().then(() => {
        // Verificar se componente ainda está montado
        if (!isMounted) {
          return;
        }
      });
    } else {
      // Resetar quando não há userId
      if (isMounted) {
        setConnections([]);
        setLoading(false);
      }
    }

    // Cleanup
    return () => {
      isMounted = false;
      setLoading(false);
      setImporting(null);
    };
  }, [userId]);

  const loadConnections = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setConnections([]);
      loadingRef.current = false;
      return;
    }

    // Prevenir múltiplas chamadas simultâneas
    if (loadingRef.current) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      const data = await getUserConnections(userId);
      
      // Verificar se ainda temos userId antes de atualizar estado
      if (userId) {
        setConnections(data || []);
      }
    } catch (error: any) {
      console.error('Erro ao carregar conexões:', error);
      
      // Verificar se é erro de tabela não encontrada
      if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
        showError('Tabela de conexões não encontrada. Execute o script SQL de setup no Supabase.');
      } else {
        showError(error?.message || 'Não foi possível carregar as conexões');
      }
      
      if (userId) {
        setConnections([]);
      }
    } finally {
      loadingRef.current = false;
      if (userId) {
        setLoading(false);
      }
    }
  }, [userId, showError]);

  const handleRenewConsent = async (connection: OpenFinanceConnection) => {
    if (!userId) return;

    Alert.alert(
      'Renovar Consentimento',
      `Deseja renovar o consentimento para ${connection.bank_name}?\n\nO consentimento será renovado por mais 90 dias.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            // Não fazer nada
          }
        },
        {
          text: 'Renovar',
          onPress: async () => {
            if (renewing === connection.id) return; // Prevenir múltiplas chamadas
            
            try {
              setRenewing(connection.id);
              
              // Gerar novos tokens simulados (em produção, isso viria da API do provedor)
              const newAccessToken = `token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              const newRefreshToken = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`;
              const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 dias
              
              await renewConsent(
                connection.id,
                userId,
                newAccessToken,
                newRefreshToken,
                expiresAt
              );
              
              showSuccess(`Consentimento renovado para ${connection.bank_name}`, {
                iconType: 'link',
              });
              
              // Aguardar um pouco antes de recarregar para evitar race conditions
              setTimeout(() => {
                if (userId) {
                  loadConnections();
                }
              }, 500);
            } catch (error: any) {
              console.error('Erro ao renovar consentimento:', error);
              showError(error.message || 'Não foi possível renovar o consentimento');
            } finally {
              setRenewing(null);
            }
          },
        },
      ]
    );
  };

  const handleRevokeConsent = async (connection: OpenFinanceConnection) => {
    if (!userId) return;

    Alert.alert(
      'Revogar Consentimento',
      `Deseja revogar o consentimento para ${connection.bank_name}?\n\n⚠️ Esta ação não pode ser desfeita. Você precisará criar uma nova conexão para acessar os dados novamente.`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            // Não fazer nada
          }
        },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeConsent(connection.id, userId);
              
              showSuccess(`Consentimento revogado para ${connection.bank_name}`, {
                iconType: 'link',
              });
              
              // Aguardar um pouco antes de recarregar para evitar race conditions
              setTimeout(() => {
                if (userId) {
                  loadConnections();
                }
              }, 500);
            } catch (error: any) {
              console.error('Erro ao revogar consentimento:', error);
              showError(error.message || 'Não foi possível revogar o consentimento');
            }
          },
        },
      ]
    );
  };

  const handleImportTransactions = async (connection: OpenFinanceConnection) => {
    if (!userId) return;

    setImporting(connection.id);

    try {
      // TODO: Implementar busca real de transações da API
      // Por enquanto, simular transações de exemplo
      const mockTransactions: ImportedTransaction[] = [
        {
          bank_transaction_id: 'tx_001',
          description: 'Transferência recebida',
          amount: 1000.0,
          date: new Date().toISOString().split('T')[0],
          type: 'credit',
          category: 'Transferência',
        },
        {
          bank_transaction_id: 'tx_002',
          description: 'Pagamento de fornecedor',
          amount: -500.0,
          date: new Date().toISOString().split('T')[0],
          type: 'debit',
          category: 'Fornecedores',
        },
      ];

      const result = await importTransactions(
        connection.id,
        userId,
        mockTransactions,
        connection.conta_bancaria_id || undefined
      );

      showSuccess(`${result.imported} transações importadas com sucesso!`);
      // Aguardar um pouco antes de recarregar para evitar race conditions
      setTimeout(() => {
        if (userId) {
          loadConnections();
        }
      }, 500);
    } catch (error: any) {
      showError(error.message || 'Não foi possível importar transações');
    } finally {
      setImporting(null);
    }
  };

  const handleImportBalance = async (connection: OpenFinanceConnection) => {
    if (!userId) return;

    setImporting(connection.id);

    try {
      // TODO: Implementar busca real de saldo da API
      const mockBalance = 5000.0;

      await importBalance(
        connection.id,
        userId,
        mockBalance,
        connection.conta_bancaria_id || undefined
      );

      showSuccess('Saldo importado com sucesso!');
      // Aguardar um pouco antes de recarregar para evitar race conditions
      setTimeout(() => {
        if (userId) {
          loadConnections();
        }
      }, 500);
    } catch (error: any) {
      showError(error.message || 'Não foi possível importar saldo');
    } finally {
      setImporting(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'expired':
        return '#FBBF24';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#6366F1';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'expired':
        return 'Expirada';
      case 'error':
        return 'Erro';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ActivityIndicator size="large" color="#00b09b" />
          <ThemedText style={styles.loadingText}>Carregando conexões...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        <View>
          <ScreenHeader
            title="Conexões Open Finance"
            subtitle={`${connections.length} conexão${connections.length !== 1 ? 'ões' : ''} cadastrada${connections.length !== 1 ? 's' : ''}`}
            rightAction={{
              icon: 'add',
              onPress: () => setNewConnectionVisible(true),
            }}
            showCompanySelector={true}
          />
        </View>

        {connections.length === 0 ? (
          <GlassContainer style={styles.emptyState}>
            <IconSymbol name="link.circle" size={48} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>
              Nenhuma conexão cadastrada
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Conecte sua primeira conta bancária via Open Finance
            </ThemedText>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setNewConnectionVisible(true)}
              activeOpacity={0.7}>
              <Text style={styles.emptyStateButtonText}>Conectar Conta</Text>
            </TouchableOpacity>
          </GlassContainer>
        ) : (
          <View style={styles.connectionsList}>
            {connections.map((connection) => {
              const bank = getBankByCode(connection.bank_code);
              const expired = isTokenExpired(connection.expires_at);
              const isImporting = importing === connection.id;

              return (
                <GlassContainer key={connection.id} style={styles.connectionCard}>
                  <View style={styles.connectionHeader}>
                    <View style={styles.connectionIcon}>
                      <IconSymbol name="building.columns.fill" size={24} color="#00b09b" />
                    </View>
                    <View style={styles.connectionInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.connectionBank}>
                        {bank?.name || connection.bank_name}
                      </ThemedText>
                      <ThemedText style={styles.connectionAccount}>
                        {connection.account_type === 'checking' ? 'Conta Corrente' : 
                         connection.account_type === 'savings' ? 'Poupança' : 'Investimento'}
                      </ThemedText>
                      <ThemedText style={styles.connectionProvider}>
                        Provedor: {connection.provider === 'open_banking' ? 'Open Banking' :
                                   connection.provider === 'plugg' ? 'Pluggy' : 'Belvo'}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(connection.status)}20` },
                      ]}>
                      <Text style={[styles.statusText, { color: getStatusColor(connection.status) }]}>
                        {getStatusLabel(connection.status)}
                      </Text>
                    </View>
                  </View>

                  {connection.last_sync_at && (
                    <View style={styles.syncInfo}>
                      <IconSymbol name="clock.fill" size={14} color="rgba(255, 255, 255, 0.6)" />
                      <ThemedText style={styles.syncText}>
                        Última sincronização: {new Date(connection.last_sync_at).toLocaleString('pt-BR')}
                      </ThemedText>
                    </View>
                  )}

                  {expired && connection.status === 'active' && (
                    <View style={styles.warningBanner}>
                      <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FBBF24" />
                      <Text style={styles.warningText}>
                        Token expirado. Renove o consentimento para continuar usando.
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    {connection.status === 'active' && !expired && (
                      <>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleImportTransactions(connection)}
                          disabled={isImporting}
                          activeOpacity={0.7}>
                          <IconSymbol
                            name="arrow.down.circle.fill"
                            size={16}
                            color={isImporting ? 'rgba(0, 176, 155, 0.5)' : '#00b09b'}
                          />
                          <Text style={[styles.actionButtonText, isImporting && styles.actionButtonTextDisabled]}>
                            {isImporting ? 'Importando...' : 'Importar Transações'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleImportBalance(connection)}
                          disabled={isImporting}
                          activeOpacity={0.7}>
                          <IconSymbol
                            name="dollarsign.circle.fill"
                            size={16}
                            color={isImporting ? 'rgba(0, 176, 155, 0.5)' : '#00b09b'}
                          />
                          <Text style={[styles.actionButtonText, isImporting && styles.actionButtonTextDisabled]}>
                            {isImporting ? 'Importando...' : 'Importar Saldo'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, (expired || connection.status === 'expired') && styles.actionButtonWarning]}
                      onPress={() => handleRenewConsent(connection)}
                      disabled={renewing === connection.id}
                      activeOpacity={0.7}>
                      {renewing === connection.id ? (
                        <ActivityIndicator size="small" color={(expired || connection.status === 'expired') ? '#FBBF24' : '#00b09b'} />
                      ) : (
                        <IconSymbol 
                          name="arrow.clockwise.circle.fill" 
                          size={16} 
                          color={(expired || connection.status === 'expired') ? '#FBBF24' : '#00b09b'} 
                        />
                      )}
                      <Text style={[
                        styles.actionButtonText, 
                        { color: (expired || connection.status === 'expired') ? '#FBBF24' : '#00b09b' },
                        renewing === connection.id && styles.actionButtonTextDisabled
                      ]}>
                        {renewing === connection.id ? 'Renovando...' : 'Renovar Consentimento'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        setSelectedConnection(connection);
                        setLogsVisible(true);
                      }}
                      activeOpacity={0.7}>
                      <IconSymbol name="list.bullet" size={16} color="#6366F1" />
                      <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>
                        Ver Logs
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleRevokeConsent(connection)}
                      activeOpacity={0.7}>
                      <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
                      <Text style={styles.actionButtonTextDanger}>
                        Revogar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </GlassContainer>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modais */}
      <NewConnectionModal
        visible={newConnectionVisible}
        onClose={() => setNewConnectionVisible(false)}
        onSuccess={() => {
          // Aguardar um pouco antes de recarregar para evitar race conditions
          setTimeout(() => {
            if (userId) {
              loadConnections();
            }
          }, 500);
        }}
      />

      <IntegrationLogsModal
        visible={logsVisible}
        onClose={() => {
          setLogsVisible(false);
          setSelectedConnection(null);
        }}
        connectionId={selectedConnection?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
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
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#00b09b',
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionsList: {
    gap: 16,
    marginTop: 16,
  },
  connectionCard: {
    padding: 16,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  connectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionBank: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  connectionAccount: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  connectionProvider: {
    fontSize: 12,
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#FBBF24',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  actionButtonWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  actionButtonText: {
    color: '#00b09b',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextDisabled: {
    color: 'rgba(0, 176, 155, 0.5)',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
