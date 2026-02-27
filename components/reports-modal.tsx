import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
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
import { exportReportToPDF } from '@/lib/services/report-pdf';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import { formatCurrency } from '@/lib/utils/currency';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/NotificationToast';

function formatReportDate(dateStr: string) {
  if (!dateStr?.trim()) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'reconciliation' | 'cashflow' | null;

export function ReportsModal({ visible, onClose }: ReportsModalProps) {
  const { userId } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const insets = useSafeAreaInsets();
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>(undefined);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [reconciliationData, setReconciliationData] = useState<ReconciliationReportData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<CashFlowReportData | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const resultAnim = useRef(new Animated.Value(0)).current;

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
        resultAnim.setValue(0);
        Animated.timing(resultAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
        showSuccess('Relatório conciliado x não conciliado gerado', {
          iconType: 'reconciliation',
          duration: 3000,
        });
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
        showSuccess('Relatório de fluxo de caixa gerado com sucesso!', { 
          iconType: 'export',
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error('Erro ao gerar relatório:', error);
      showError(error?.message || 'Não foi possível gerar o relatório', { 
        iconType: 'export' 
      });
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
          showSuccess('Relatório exportado com sucesso!', { 
            iconType: 'export',
            duration: 3000,
          });
        } else {
          showInfo('Arquivo salvo em: ' + fileUri, { 
            iconType: 'export',
            duration: 5000,
          });
        }
      } catch (error: any) {
        console.error('Erro ao exportar CSV:', error);
        showError(error?.message || 'Não foi possível exportar o relatório', { 
          iconType: 'export' 
        });
      }
    }
  };

  const handleExportPDF = async () => {
    if (!selectedReport) return;
    const data = selectedReport === 'reconciliation' ? reconciliationData : cashFlowData;
    if (!data) return;

    setExportingPdf(true);
    try {
      const uri = await exportReportToPDF(data, selectedReport);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar relatório (PDF)',
        });
        showSuccess('Relatório exportado com sucesso!', {
          iconType: 'export',
          duration: 3000,
        });
      } else {
        showInfo('PDF gerado. Salve pelo visualizador do sistema.', {
          iconType: 'export',
          duration: 5000,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Não foi possível gerar o PDF';
      showError(message, { iconType: 'export' });
    } finally {
      setExportingPdf(false);
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
                        Extrato conciliado x não conciliado, com dados reais e exportação CSV
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
                  <ThemedText style={styles.filterLabel}>Conta Bancária:</ThemedText>
                  <TouchableOpacity
                    style={styles.accountPicker}
                    onPress={() => setShowAccountPicker((v) => !v)}
                    activeOpacity={0.8}>
                    <Text style={styles.accountPickerText}>
                      {selectedAccount
                        ? contas.find((c) => c.id === selectedAccount)?.descricao
                        : 'Todas as contas'}
                    </Text>
                    <IconSymbol name="chevron.down" size={16} color="rgba(255, 255, 255, 0.7)" />
                  </TouchableOpacity>
                  {showAccountPicker && (
                    <View style={styles.accountPickerDropdown}>
                      <TouchableOpacity
                        style={styles.accountPickerOption}
                        onPress={() => {
                          setSelectedAccount(undefined);
                          setShowAccountPicker(false);
                        }}
                        activeOpacity={0.7}>
                        <ThemedText style={styles.accountPickerOptionText}>Todas as contas</ThemedText>
                      </TouchableOpacity>
                      {contas.map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={styles.accountPickerOption}
                          onPress={() => {
                            setSelectedAccount(c.id!);
                            setShowAccountPicker(false);
                          }}
                          activeOpacity={0.7}>
                          <ThemedText style={styles.accountPickerOptionText}>{c.descricao}</ThemedText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.actions}>
                  <Button
                    title="Voltar"
                    onPress={() => {
                      setSelectedReport(null);
                      setReconciliationData(null);
                      setCashFlowData(null);
                    }}
                    variant="outline"
                    style={styles.button}
                  />
                  <Button
                    title="Gerar Relatório"
                    onPress={handleGenerateReport}
                    loading={loading}
                    style={[styles.button, styles.primaryButton]}
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
                <Animated.View
                  style={[
                    styles.resultsContainer,
                    {
                      opacity: resultAnim,
                      transform: [
                        {
                          translateY: resultAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [16, 0],
                          }),
                        },
                      ],
                    },
                  ]}>
                  <GlassContainer style={styles.summaryCard}>
                    <ThemedText type="subtitle" style={styles.resultsTitle}>
                      Conciliado x Não conciliado
                    </ThemedText>
                    <ThemedText style={styles.periodText}>
                      Período: {formatReportDate(reconciliationData.period.start)} a {formatReportDate(reconciliationData.period.end)}
                    </ThemedText>

                    <View style={styles.summaryGrid}>
                      <View style={[styles.summaryItem, styles.summaryItemHighlight]}>
                        <ThemedText style={styles.summaryLabel}>Total conciliado</ThemedText>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[styles.summaryValueCashFlow, { color: '#10B981' }]}>
                          {formatCurrency(reconciliationData.totalConciliado)}
                        </Text>
                        <ThemedText style={styles.summaryMeta}>
                          {reconciliationData.transacoesConciliadas} trans. · {reconciliationData.titulosConciliados} tít.
                        </ThemedText>
                      </View>
                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Não conciliado</ThemedText>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[styles.summaryValueCashFlow, { color: '#F59E0B' }]}>
                          {formatCurrency(reconciliationData.totalNaoConciliado)}
                        </Text>
                        <ThemedText style={styles.summaryMeta}>
                          Sobras: {formatCurrency(reconciliationData.totalSobrasValor)} · Faltas: {formatCurrency(reconciliationData.totalFaltasValor)}
                        </ThemedText>
                      </View>
                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Taxa de conciliação</ThemedText>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={styles.summaryValueCashFlow}>
                          {reconciliationData.taxaConciliacao.toFixed(1)}%
                        </Text>
                      </View>
                    </View>

                    {/* Lista: Conciliados */}
                    {reconciliationData.conciliados.length > 0 && (
                      <View style={styles.reportSection}>
                        <View style={styles.reportSectionHeader}>
                          <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />
                          <ThemedText type="defaultSemiBold" style={styles.reportSectionTitle}>
                            Conciliados ({reconciliationData.conciliados.length})
                          </ThemedText>
                        </View>
                        <View style={styles.reportList}>
                          {reconciliationData.conciliados.slice(0, 15).map((c) => (
                            <View key={`${c.transacao_id}-${c.titulo_id}`} style={styles.reportRow}>
                              <View style={styles.reportRowContent}>
                                <ThemedText style={styles.reportRowDesc} numberOfLines={1}>
                                  {c.descricao_tx} ↔ {c.descricao_titulo}
                                </ThemedText>
                                <ThemedText style={styles.reportRowMeta}>
                                  {formatReportDate(c.data_transacao)} · {formatCurrency(c.valor)}
                                </ThemedText>
                              </View>
                            </View>
                          ))}
                          {reconciliationData.conciliados.length > 15 && (
                            <ThemedText style={styles.reportMore}>
                              +{reconciliationData.conciliados.length - 15} no CSV
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Lista: Sobras (não conciliado) */}
                    {reconciliationData.sobras.length > 0 && (
                      <View style={styles.reportSection}>
                        <View style={styles.reportSectionHeader}>
                          <IconSymbol name="building.columns.fill" size={18} color="#F59E0B" />
                          <ThemedText type="defaultSemiBold" style={styles.reportSectionTitle}>
                            Sobras — extrato sem título ({reconciliationData.sobras.length})
                          </ThemedText>
                        </View>
                        <View style={styles.reportList}>
                          {reconciliationData.sobras.slice(0, 10).map((s) => (
                            <View key={s.id} style={styles.reportRow}>
                              <View style={styles.reportRowContent}>
                                <ThemedText style={styles.reportRowDesc} numberOfLines={1}>
                                  {s.descricao || 'Sem descrição'}
                                </ThemedText>
                                <ThemedText style={styles.reportRowMeta}>
                                  {formatReportDate(s.data)} ·{' '}
                                  <Text style={{ color: s.tipo === 'receita' ? '#10B981' : '#EF4444' }}>
                                    {s.tipo === 'receita' ? '+' : '-'}{formatCurrency(s.valor)}
                                  </Text>
                                </ThemedText>
                              </View>
                            </View>
                          ))}
                          {reconciliationData.sobras.length > 10 && (
                            <ThemedText style={styles.reportMore}>
                              +{reconciliationData.sobras.length - 10} no CSV
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Lista: Faltas (não conciliado) */}
                    {reconciliationData.faltas.length > 0 && (
                      <View style={styles.reportSection}>
                        <View style={styles.reportSectionHeader}>
                          <IconSymbol name="doc.text.fill" size={18} color="#6366F1" />
                          <ThemedText type="defaultSemiBold" style={styles.reportSectionTitle}>
                            Faltas — título sem transação ({reconciliationData.faltas.length})
                          </ThemedText>
                        </View>
                        <View style={styles.reportList}>
                          {reconciliationData.faltas.slice(0, 10).map((f) => (
                            <View key={f.id} style={styles.reportRow}>
                              <View style={styles.reportRowContent}>
                                <ThemedText style={styles.reportRowDesc} numberOfLines={1}>
                                  {f.descricao || 'Sem descrição'}
                                </ThemedText>
                                <ThemedText style={styles.reportRowMeta}>
                                  {formatReportDate(f.data_vencimento)} ·{' '}
                                  <Text style={{ color: f.tipo === 'receber' ? '#10B981' : '#EF4444' }}>
                                    {f.tipo === 'receber' ? '+' : '-'}{formatCurrency(f.valor)}
                                  </Text>
                                </ThemedText>
                              </View>
                            </View>
                          ))}
                          {reconciliationData.faltas.length > 10 && (
                            <ThemedText style={styles.reportMore}>
                              +{reconciliationData.faltas.length - 10} no CSV
                            </ThemedText>
                          )}
                        </View>
                      </View>
                    )}

                    {reconciliationData.conciliados.length === 0 &&
                      reconciliationData.sobras.length === 0 &&
                      reconciliationData.faltas.length === 0 && (
                        <View style={styles.emptyReport}>
                          <IconSymbol name="checkmark.circle.fill" size={40} color="rgba(16, 185, 129, 0.6)" />
                          <ThemedText style={styles.emptyReportText}>
                            Nenhum dado no período
                          </ThemedText>
                          <ThemedText style={styles.emptyReportSubtext}>
                            Altere as datas ou a conta e gere novamente.
                          </ThemedText>
                        </View>
                    )}

                    <View style={styles.exportRow}>
                      <Button
                        title="Exportar CSV"
                        onPress={handleExportCSV}
                        style={[styles.exportButton, styles.primaryButton]}
                      />
                      <Button
                        title={exportingPdf ? 'Gerando PDF…' : 'Exportar PDF'}
                        onPress={handleExportPDF}
                        disabled={exportingPdf}
                        style={[styles.exportButton, styles.primaryButton]}
                      />
                    </View>
                  </GlassContainer>
                </Animated.View>
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
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[styles.summaryValueCashFlow, { color: '#10B981' }]}>
                          {formatCurrency(cashFlowData.totals.totalIncome)}
                        </Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Total Saídas</ThemedText>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[styles.summaryValueCashFlow, { color: '#EF4444' }]}>
                          {formatCurrency(cashFlowData.totals.totalExpense)}
                        </Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <ThemedText style={styles.summaryLabel}>Saldo Líquido</ThemedText>
                        <Text
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          style={[
                            styles.summaryValueCashFlow,
                            {
                              color:
                                cashFlowData.totals.netBalance >= 0 ? '#10B981' : '#EF4444',
                            },
                          ]}>
                          {formatCurrency(cashFlowData.totals.netBalance)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.exportRow}>
                      <Button
                        title="Exportar CSV"
                        onPress={handleExportCSV}
                        style={[styles.exportButton, styles.primaryButton]}
                      />
                      <Button
                        title={exportingPdf ? 'Gerando PDF…' : 'Exportar PDF'}
                        onPress={handleExportPDF}
                        disabled={exportingPdf}
                        style={[styles.exportButton, styles.primaryButton]}
                      />
                    </View>
                  </GlassContainer>
                </View>
              )}
            </View>
          )}
        </ScrollView>
        <Toast config={toastConfig} topOffset={60} />
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
  primaryButton: {
    backgroundColor: '#00b09b',
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
    marginBottom: 8,
  },
  periodText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
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
  summaryItemHighlight: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  summaryMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
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
  summaryValueCashFlow: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  exportButton: {
    flex: 1,
    marginTop: 0,
  },
  reportSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reportSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reportSectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  reportList: {
    gap: 8,
  },
  reportRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
  },
  reportRowContent: {
    gap: 4,
  },
  reportRowDesc: {
    fontSize: 13,
    color: '#FFFFFF',
  },
  reportRowMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  reportMore: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyReport: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  emptyReportText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyReportSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  accountPickerDropdown: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  accountPickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  accountPickerOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
