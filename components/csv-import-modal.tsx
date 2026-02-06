import React, { useState } from 'react';
import {
  Alert,
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
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Button } from './ui/button';
import { parseCSV, validateTransactionCSV, generateCSVTemplate, type ValidationResult } from '@/lib/utils/csv-parser';
import { criarTransacao, type Transaction } from '@/lib/services/transactions';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { formatCurrency } from '@/lib/utils/currency';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/NotificationToast';

interface CSVImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CSVImportModal({ visible, onClose, onSuccess }: CSVImportModalProps) {
  const { userId } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'importing'>('select');
  const [csvContent, setCsvContent] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  React.useEffect(() => {
    if (visible && userId) {
      loadAccounts();
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

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setLoading(true);

      // Ler conteúdo do arquivo
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      setCsvContent(fileContent);

      // Validar CSV
      const parsed = parseCSV(fileContent);
      const validation = validateTransactionCSV(parsed, contas);

      setValidationResult(validation);
      setStep('preview');
      
      // Notificar se houver erros de validação
      if (validation.invalidRows.length > 0) {
        showInfo(`Arquivo carregado. ${validation.invalidRows.length} linhas com erro serão ignoradas.`, {
          iconType: 'export',
          duration: 4000,
        });
      } else {
        showSuccess('Arquivo CSV validado com sucesso!', { iconType: 'export' });
      }
    } catch (error: any) {
      showError('Não foi possível ler o arquivo: ' + error.message, { iconType: 'export' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateCSVTemplate();
    // TODO: Implementar download do template
    showInfo('Template CSV: use este formato para criar seu arquivo.', { 
      iconType: 'export',
      duration: 4000,
    });
  };

  const handleImport = async () => {
    if (!validationResult || !userId) return;

    setStep('importing');
    setImporting(true);
    setImportedCount(0);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < validationResult.validRows.length; i++) {
      const row = validationResult.validRows[i];
      
      try {
        // Encontrar conta bancária se informada
        let contaId: number | null = null;
        if (row.conta_bancaria) {
          const conta = contas.find(
            c => c.descricao.toLowerCase() === row.conta_bancaria!.toLowerCase()
          );
          contaId = conta?.id || null;
        }

        // Converter valor
        const valor = parseFloat(row.valor.replace(/[^\d,.-]/g, '').replace(',', '.'));

        const transacao: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
          codigo_empresa: userId,
          descricao: row.descricao,
          valor,
          data: row.data,
          tipo: row.tipo,
          categoria: row.categoria,
          conta_bancaria_id: contaId,
        };

        await criarTransacao(transacao);
        successCount++;
        setImportedCount(successCount);
      } catch (error: any) {
        errorCount++;
        errors.push(`Linha ${i + 2}: ${error.message || 'Erro desconhecido'}`);
      }
    }

    setImporting(false);

    if (successCount > 0) {
      showSuccess(
        `${successCount} transações importadas com sucesso!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`,
        { 
          iconType: 'export',
          title: 'Importação concluída',
          duration: 4000,
        }
      );
      onSuccess?.();
      handleClose();
      
      if (errorCount > 0 && errors.length > 0) {
        // Mostrar primeiros erros como informação adicional
        setTimeout(() => {
          const primeirosErros = errors.slice(0, 3).join('\n');
          showInfo(`Erros encontrados:\n${primeirosErros}${errors.length > 3 ? '\n...' : ''}`, {
            iconType: 'export',
            duration: 6000,
          });
        }, 1000);
      }
    } else {
      showError('Nenhuma transação foi importada. Verifique os erros e tente novamente.', { 
        iconType: 'export' 
      });
    }
  };

  const handleClose = () => {
    setStep('select');
    setCsvContent('');
    setValidationResult(null);
    setImportedCount(0);
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
              Importar Transações (CSV)
            </ThemedText>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={24} color="rgba(255, 255, 255, 0.7)" />
            </TouchableOpacity>
          </View>
        </View>

        {step === 'select' && (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.content, { paddingTop: 16 }]}
            showsVerticalScrollIndicator={false}>
            <GlassContainer style={styles.instructionCard}>
              <ThemedText type="subtitle" style={styles.instructionTitle}>
                Como usar:
              </ThemedText>
              <ThemedText style={styles.instructionText}>
                1. Baixe o template CSV (opcional){'\n'}
                2. Preencha com suas transações{'\n'}
                3. Selecione o arquivo para importar{'\n'}
                4. Revise os dados antes de confirmar
              </ThemedText>
            </GlassContainer>

            <View style={styles.actions}>
              <Button
                title="Baixar Template CSV"
                onPress={handleDownloadTemplate}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Selecionar Arquivo CSV"
                onPress={handleSelectFile}
                loading={loading}
                style={[styles.button, styles.primaryButton]}
              />
            </View>
          </ScrollView>
        )}

        {step === 'preview' && validationResult && (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[styles.content, { paddingTop: 16 }]}
            showsVerticalScrollIndicator={false}>
            <GlassContainer style={styles.previewCard}>
              <ThemedText type="subtitle" style={styles.previewTitle}>
                Preview da Importação
              </ThemedText>

              {validationResult.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  <ThemedText style={styles.errorsTitle}>
                    Erros encontrados ({validationResult.errors.length}):
                  </ThemedText>
                  {validationResult.errors.slice(0, 10).map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}
                  {validationResult.errors.length > 10 && (
                    <Text style={styles.errorText}>
                      ... e mais {validationResult.errors.length - 10} erros
                    </Text>
                  )}
                </View>
              )}

              {validationResult.warnings.length > 0 && (
                <View style={styles.warningsContainer}>
                  <ThemedText style={styles.warningsTitle}>
                    Avisos ({validationResult.warnings.length}):
                  </ThemedText>
                  {validationResult.warnings.slice(0, 5).map((warning, index) => (
                    <Text key={index} style={styles.warningText}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.summaryContainer}>
                <ThemedText style={styles.summaryText}>
                  ✅ {validationResult.validRows.length} transações válidas prontas para importar
                </ThemedText>
                {validationResult.errors.length > 0 && (
                  <ThemedText style={styles.summaryText}>
                    ❌ {validationResult.errors.length} erros encontrados
                  </ThemedText>
                )}
              </View>

              {validationResult.validRows.length > 0 && (
                <View style={styles.previewTable}>
                  <ThemedText style={styles.tableHeader}>Primeiras 5 transações:</ThemedText>
                  {validationResult.validRows.slice(0, 5).map((row, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{row.descricao}</Text>
                      <Text style={styles.tableCell}>{formatCurrency(parseFloat(row.valor.replace(/[^\d,.-]/g, '').replace(',', '.')))}</Text>
                      <Text style={styles.tableCell}>{row.data}</Text>
                      <Text style={[styles.tableCell, { color: row.tipo === 'receita' ? '#10B981' : '#EF4444' }]}>
                        {row.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.actions}>
                <Button
                  title="Voltar"
                  onPress={() => setStep('select')}
                  variant="outline"
                  style={styles.button}
                />
                {validationResult.validRows.length > 0 && (
                  <Button
                    title={`Importar ${validationResult.validRows.length} Transações`}
                    onPress={handleImport}
                    style={[styles.button, styles.primaryButton]}
                  />
                )}
              </View>
            </GlassContainer>
          </ScrollView>
        )}

        {step === 'importing' && (
          <View style={[styles.content, { paddingTop: 16 }]}>
            <GlassContainer style={styles.importingCard}>
              <ActivityIndicator size="large" color="#00b09b" />
              <ThemedText type="subtitle" style={styles.importingTitle}>
                Importando Transações...
              </ThemedText>
              <ThemedText style={styles.importingText}>
                {importedCount} de {validationResult?.validRows.length || 0} importadas
              </ThemedText>
            </GlassContainer>
          </View>
        )}
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
  instructionCard: {
    padding: 20,
    marginBottom: 20,
  },
  instructionTitle: {
    color: '#FFFFFF',
    marginBottom: 12,
  },
  instructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  button: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#00b09b',
  },
  previewCard: {
    padding: 20,
  },
  previewTitle: {
    color: '#FFFFFF',
    marginBottom: 20,
  },
  errorsContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorsTitle: {
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 4,
  },
  warningsContainer: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningsTitle: {
    color: '#FBBF24',
    fontWeight: '600',
    marginBottom: 8,
  },
  warningText: {
    color: '#FBBF24',
    fontSize: 12,
    marginBottom: 4,
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  previewTable: {
    marginTop: 16,
    marginBottom: 20,
  },
  tableHeader: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tableCell: {
    flex: 1,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  importingCard: {
    padding: 40,
    alignItems: 'center',
  },
  importingTitle: {
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  importingText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
