import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import {
  createOpenFinanceConnection,
  AVAILABLE_BANKS,
  type OpenFinanceConnection,
} from '@/lib/services/open-finance';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import * as Linking from 'expo-linking';

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
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [selectedConta, setSelectedConta] = useState<number | null>(null);
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'investment'>('checking');
  const [provider, setProvider] = useState<'open_banking' | 'plugg' | 'belvo'>('open_banking');

  useEffect(() => {
    if (visible && userId) {
      loadAccounts();
    }
  }, [visible, userId]);

  const loadAccounts = async () => {
    if (!userId) return;
    try {
      const accounts = await buscarContas(userId);
      setContas(accounts || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const handleCreateConnection = async () => {
    if (!userId || !selectedBank) {
      showError('Selecione um banco para continuar');
      return;
    }

    const bank = AVAILABLE_BANKS.find((b) => b.code === selectedBank);
    if (!bank) {
      showError('Banco inválido');
      return;
    }

    if (loading) return; // Prevenir múltiplas chamadas

    setLoading(true);

    try {
      // Criar conexão pendente
      const connection = await createOpenFinanceConnection(userId, {
        conta_bancaria_id: selectedConta || undefined,
        bank_code: selectedBank,
        bank_name: bank.name,
        account_number: selectedConta ? contas.find((c) => c.id === selectedConta)?.numero_conta || '' : '',
        account_type: accountType,
        provider,
      });

      // Resetar loading antes de mostrar alert
      setLoading(false);

      // Aqui você integraria com a API real do provedor
      // Por enquanto, vamos simular o fluxo
      
      // Para Open Banking real, você precisaria:
      // 1. Chamar API do provedor para obter URL de autorização
      // 2. Abrir URL no navegador
      // 3. Processar callback quando usuário autorizar

      // Exemplo de fluxo simulado:
      Alert.alert(
        'Conectar Conta',
        `Para conectar sua conta do ${bank.name}, você será redirecionado para autorizar o acesso.`,
        [
          { 
            text: 'Cancelar', 
            style: 'cancel',
            onPress: () => {
              // Não fazer nada, apenas fechar alert
            }
          },
          {
            text: 'Continuar',
            onPress: () => {
              // TODO: Implementar abertura de URL de autorização
              // const authUrl = await getAuthUrl(connection.id);
              // await Linking.openURL(authUrl);
              
              // Mostrar notificação de sucesso
              showSuccess(`Conta ${bank.name} conectada com sucesso!`, {
                iconType: 'link',
              });
              
              // Fechar modal primeiro
              handleClose();
              
              // Navegar para tela de conexões após um pequeno delay
              setTimeout(() => {
                router.push('/(tabs)/bank-connections');
              }, 300);
              
              // Chamar callback de sucesso
              onSuccess?.();
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error: any) {
      console.error('Erro ao criar conexão:', error);
      setLoading(false);
      // Verificar se é erro de tabela não encontrada
      if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache') || error?.message?.includes('Tabela de conexões')) {
        showError('Tabela de conexões não encontrada. Execute o script SQL de setup no Supabase.');
      } else {
        showError(error?.message || 'Não foi possível criar a conexão');
      }
    }
  };

  const handleClose = () => {
    setSelectedBank(null);
    setSelectedConta(null);
    setAccountType('checking');
    setProvider('open_banking');
    onClose();
  };

  return (
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
              {/* Provedor */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Provedor *</ThemedText>
                <View style={styles.providerButtons}>
                  <TouchableOpacity
                    style={[styles.providerButton, provider === 'open_banking' && styles.providerButtonActive]}
                    onPress={() => setProvider('open_banking')}
                    activeOpacity={0.7}>
                    <Text style={[styles.providerButtonText, provider === 'open_banking' && styles.providerButtonTextActive]}>
                      Open Banking
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.providerButton, provider === 'plugg' && styles.providerButtonActive]}
                    onPress={() => setProvider('plugg')}
                    activeOpacity={0.7}>
                    <Text style={[styles.providerButtonText, provider === 'plugg' && styles.providerButtonTextActive]}>
                      Plugg.to
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.providerButton, provider === 'belvo' && styles.providerButtonActive]}
                    onPress={() => setProvider('belvo')}
                    activeOpacity={0.7}>
                    <Text style={[styles.providerButtonText, provider === 'belvo' && styles.providerButtonTextActive]}>
                      Belvo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Banco */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Banco *</ThemedText>
                <ScrollView style={styles.banksList} nestedScrollEnabled>
                  {AVAILABLE_BANKS.map((bank) => (
                    <TouchableOpacity
                      key={bank.code}
                      style={[
                        styles.bankOption,
                        selectedBank === bank.code && styles.bankOptionActive,
                      ]}
                      onPress={() => setSelectedBank(bank.code)}
                      activeOpacity={0.7}>
                      <View style={styles.bankOptionContent}>
                        <IconSymbol
                          name="building.columns.fill"
                          size={20}
                          color={selectedBank === bank.code ? '#00b09b' : 'rgba(255, 255, 255, 0.7)'}
                        />
                        <Text
                          style={[
                            styles.bankOptionText,
                            selectedBank === bank.code && styles.bankOptionTextActive,
                          ]}>
                          {bank.name} ({bank.code})
                        </Text>
                      </View>
                      {selectedBank === bank.code && (
                        <IconSymbol name="checkmark.circle.fill" size={20} color="#00b09b" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Conta Bancária (opcional) */}
              {contas.length > 0 && (
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Conta Bancária (opcional)</ThemedText>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={() => {
                        if (selectedConta === null) {
                          setSelectedConta(contas[0]?.id || null);
                        } else {
                          const currentIndex = contas.findIndex((c) => c.id === selectedConta);
                          if (currentIndex === contas.length - 1) {
                            setSelectedConta(null);
                          } else {
                            setSelectedConta(contas[currentIndex + 1]?.id || null);
                          }
                        }
                      }}
                      activeOpacity={0.7}>
                      <Text style={styles.pickerText}>
                        {selectedConta
                          ? contas.find((c) => c.id === selectedConta)?.descricao || 'Selecione'
                          : 'Nenhuma (criar nova)'}
                      </Text>
                      <IconSymbol name="chevron.down" size={16} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Tipo de Conta */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Tipo de Conta *</ThemedText>
                <View style={styles.accountTypeButtons}>
                  <TouchableOpacity
                    style={[styles.accountTypeButton, accountType === 'checking' && styles.accountTypeButtonActive]}
                    onPress={() => setAccountType('checking')}
                    activeOpacity={0.7}>
                    <Text style={[styles.accountTypeButtonText, accountType === 'checking' && styles.accountTypeButtonTextActive]}>
                      Conta Corrente
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.accountTypeButton, accountType === 'savings' && styles.accountTypeButtonActive]}
                    onPress={() => setAccountType('savings')}
                    activeOpacity={0.7}>
                    <Text style={[styles.accountTypeButtonText, accountType === 'savings' && styles.accountTypeButtonTextActive]}>
                      Poupança
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.accountTypeButton, accountType === 'investment' && styles.accountTypeButtonActive]}
                    onPress={() => setAccountType('investment')}
                    activeOpacity={0.7}>
                    <Text style={[styles.accountTypeButtonText, accountType === 'investment' && styles.accountTypeButtonTextActive]}>
                      Investimento
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  title={loading ? 'Conectando...' : 'Conectar Conta'}
                  onPress={handleCreateConnection}
                  disabled={loading || !selectedBank}
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
