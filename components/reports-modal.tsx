import React, { useState, useEffect } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Button } from './ui/button';
import {
  generateReconciliationReport,
  generateCashFlowReport,
  exportReportToCSV,
  type ReconciliationReportData,
  type CashFlowReportData,
} from '@/lib/services/reports';
import { useAuth } from '@/contexts/AuthContext';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import { formatCurrency } from '@/lib/utils/currency';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'reconciliation' | 'cashflow' | null;

export function ReportsModal({ visible, onClose }: ReportsModalProps) {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>(undefined);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationReportData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowReportData | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadAccounts();
      // Definir período padrão (últimos 30 dias)
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [visible, userId]);

  const loadAccounts = async () => {
    try {
      const accounts = await buscarContas(userId!);
      setContas(accounts || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport || !startDate || !endDate || !userId) return;

    setLoading(true);

    try {
      if (selectedReport === 'reconciliation') {
        const { data, error } = await generateReconciliationReport(
          userId,
          startDate,
          endDate,
          selectedAccount
        );

        if (error) {
          throw error;
        }

        setReconciliationData(data);
      } else {
        const { data, error } = await generateCashFlowReport(
          userId,
          startDate,
          endDate,
          selectedAccount
        );

        if (error) {
          throw error;
        }

        setCashFlowData(data);
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedReport) return;

    let csvContent = '';

    if (selectedReport === 'reconciliation' && reconciliationData) {
      csvContent = exportReportToCSV(reconciliationData, 'reconciliation');
    } else if (selectedReport === 'cashflow' && cashFlowData) {
      csvContent = exportReportToCSV(cashFlowData, 'cashflow');
    }

    if (csvContent) {
      try {
        const fileUri = FileSystem.documentDirectory + `relatorio_${selectedReport}_${Date.now()}.csv`;
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      } catch (error) {
        console.error('Erro ao exportar CSV:', error);
      }
    }
  };

  const handleClose = () => {
    setSelectedReport(null);
    setReconciliationData(null);
    setCashFlowData(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        <AnimatedBackground />
        <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              Relatórios Financeiros
            </ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingTop: 16 }]}
          showsVerticalScrollIndicator={false}>
          {!selectedReport ? (
            <View style={styles.reportSelection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Selecione o tipo de relatório:
              </ThemedText>

              <TouchableOpacity
                style={styles.reportCard}
                onPress={() => setSelectedReport('reconciliation')}
                activeOpacity={0.7}>
                <GlassContainer style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#00b09b20' }]}>
                      <MaterialIcons name="account-balance" size={32} color="#00b09b" />
                    </View>
                    <View style={styles.cardInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        Relatório de Conciliação
                      </ThemedText>
                      <ThemedText style={styles.cardDescription}>
                        Visualize transações conciliadas e não conciliadas, sobras e faltas
                      </ThemedText>
                    </View>
                  </View>
                </GlassContainer>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportCard}
                onPress={() => setSelectedReport('cashflow')}
                activeOpacity={0.7}>
                <GlassContainer style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                      <IconSymbol name="chart.bar.fill" size={32} color="#10B981" />
                    </View>
                    <View style={styles.cardInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                        Fluxo de Caixa Realizado
                      </ThemedText>
                      <ThemedText style={styles.cardDescription}>
                        Análise de entradas, saídas e saldo por período (diário, semanal, mensal)
                      </ThemedText>
                    </View>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reportConfig}>
              {/* Filtros */}
              <GlassContainer style={styles.filtersCard}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Filtros
                </ThemedText>

                <View style={styles.filterRow}>
                  <ThemedText style={styles.filterLabel}>Data Início:</ThemedText>
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>

                <View style={styles.filterRow}>
                  <ThemedText style={styles.filterLabel}>Data Fim:</ThemedText>
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  />
                </View>

                <View style={styles.filterRow}>
                  <ThemedText style={styles.filterLabel}>Conta Bancária (opcional):</ThemedText>
                  <TouchableOpacity
                    style={styles.accountPicker}
                    onPress={() => {
                      // TODO: Implementar seletor de conta
                    }}>
                    <Text style={styles.accountPickerText}>
                      {selectedAccount
                        ? contas.find(c => c.id === selectedAccount)?.descricao
                        : 'Todas as contas'}
                    </Text>
                    <IconSymbol name="chevron.down" size={16} color="rgba(255, 255, 255, 0.7)" />
                  </TouchableOpacity>
                </View>

                <View style={styles.actions}>
                  <Button
                    title="Voltar"
                    onPress={() => {
                      setSelectedReport(null);
                      setReconciliationData(null);
                      setCashFlowData(null);
                    }}
                    variant="secondary"
                    style={styles.button}
                  />
                  <Button
                    title="Gerar Relatório"
                    onPress={handleGenerateReport}
                    loading={loading}
                    style={styles.button}
                  />
                </View>
              </GlassContainer>

              {/* Resultados */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#00b09b" />
                  <ThemedText style={styles.loadingText}>Gerando relatório...</ThemedText>
                </View>
              )}

              {!loading && selectedReport === 'reconciliation' && reconciliationData && (
                <View style={styles.resultsContainer}>
                  <GlassContainer style={styles.summaryCard}>
                    <ThemedText type="subtitle" style={styles.resultsTitle}>
                      Resumo de Conciliação
                    </ThemedText>

                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Total Conciliado</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                          {formatCurrency(reconciliationData.totalConciliado)}
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Não Conciliado</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                          {formatCurrency(reconciliationData.totalNaoConciliado)}
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Taxa de Conciliação</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                          {reconciliationData.taxaConciliacao.toFixed(1)}%
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Sobras</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                          {reconciliationData.sobras.length}
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Faltas</ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.summaryValue}>
                          {reconciliationData.faltas.length}
                        </ThemedText>
                      </View>
                    </View>

                    <Button
                      title="Exportar CSV"
                      onPress={handleExportCSV}
                      style={styles.exportButton}
                    />
                  </GlassContainer>
                </View>
              )}

              {!loading && selectedReport === 'cashflow' && cashFlowData && (
                <View style={styles.resultsContainer}>
                  <GlassContainer style={styles.summaryCard}>
                    <ThemedText type="subtitle" style={styles.resultsTitle}>
                      Resumo de Fluxo de Caixa
                    </ThemedText>

                    <View style={styles.summaryGrid}>
                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Total Entradas</ThemedText>
                        <ThemedText type="defaultSemiBold" style={[styles.summaryValue, { color: '#10B981' }]}>
                          {formatCurrency(cashFlowData.totals.totalIncome)}
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Total Saídas</ThemedText>
                        <ThemedText type="defaultSemiBold" style={[styles.summaryValue, { color: '#EF4444' }]}>
                          {formatCurrency(cashFlowData.totals.totalExpense)}
                        </ThemedText>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Saldo Líquido</ThemedText>
                        <ThemedText
                          type="defaultSemiBold"
                          style={[
                            styles.summaryValue,
                            {
                              color:
                                cashFlowData.totals.netBalance >= 0 ? '#10B981' : '#EF4444',
                            },
                          ]}>
                          {formatCurrency(cashFlowData.totals.netBalance)}
                        </ThemedText>
                      </View>
                    </View>

                    <Button
                      title="Exportar CSV"
                      onPress={handleExportCSV}
                      style={styles.exportButton}
                    />
                  </GlassContainer>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#001a2e',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  reportSelection: {
    gap: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  reportCard: {
    marginBottom: 12,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 6,
  },
  cardDescription: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  reportConfig: {
    gap: 16,
  },
  filtersCard: {
    padding: 20,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  accountPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  accountPickerText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 12,
  },
  resultsContainer: {
    marginTop: 16,
  },
  summaryCard: {
    padding: 20,
  },
  resultsTitle: {
    color: '#FFFFFF',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  exportButton: {
    marginTop: 8,
  },
});
