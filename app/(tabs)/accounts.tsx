import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { toastConfig } from '@/components/NotificationToast';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useNotification } from '@/hooks/use-notification';
import { useScreenAnimations } from '@/hooks/use-screen-animations';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import { atualizarConta, buscarContas, criarConta, deletarConta, type ContaBancaria } from '@/lib/contas';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError } = useNotification();
  const scrollRef = useScrollToTop(); // ✅ Hook para resetar scroll
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaBancaria | null>(null);
  const { animatedStyle: headerStyle } = useScreenAnimations(0);
  const [accountAnims, setAccountAnims] = useState<Animated.Value[]>([]);
  
  // Formulário
  const [codigoContaBanco, setCodigoContaBanco] = useState('');
  const [codigoBanco, setCodigoBanco] = useState('');
  const [codigoAgencia, setCodigoAgencia] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroConta, setNumeroConta] = useState('');
  const [modalError, setModalError] = useState('');

  const { selectedCompany } = useCompany();

  useEffect(() => {
    if (userId) {
      carregarContas(userId);
    } else {
      setLoading(false);
    }
  }, [userId, selectedCompany]); // ✅ Dependência correta

  useEffect(() => {
    const anims = contas.map(() => new Animated.Value(0));
    setAccountAnims(anims);
    
    anims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 100 + (index * 50),
        useNativeDriver: true,
      }).start();
    });
  }, [contas.length]);

  const carregarContas = async (userId: string) => {
    try {
      console.log('💳 Contas: Carregando dados para userId:', userId);
      setLoading(true);
      const dados = await buscarContas(userId);
      console.log('✅ Contas carregadas:', dados?.length || 0);
      setContas(dados || []);
    } catch (error) {
      console.error('❌ Erro ao carregar contas:', error);
      setContas([]);
      showError('Não foi possível carregar as contas.');
    } finally {
      setLoading(false); // ✅ CORRIGIDO
    }
  };

  const abrirModalAdicionar = () => {
    setEditingConta(null);
    setCodigoContaBanco('');
    setCodigoBanco('');
    setCodigoAgencia('');
    setDescricao('');
    setNumeroConta('');
    setModalVisible(true);
  };

  const abrirModalEditar = (conta: ContaBancaria) => {
    setEditingConta(conta);
    setCodigoContaBanco(conta.codigo_conta_banco.toString());
    setCodigoBanco(conta.codigo_banco.toString());
    setCodigoAgencia(conta.codigo_agencia.toString());
    setDescricao(conta.descricao);
    setNumeroConta(conta.numero_conta);
    setModalVisible(true);
  };

  const fecharModal = () => {
    setModalVisible(false);
    setEditingConta(null);
    setCodigoContaBanco('');
    setCodigoBanco('');
    setCodigoAgencia('');
    setDescricao('');
    setNumeroConta('');
    setModalError('');
  };

  // Função auxiliar para validar se é número
  const validarNumero = (valor: string, nomeCampo: string): { valido: boolean; mensagem?: string } => {
    if (!valor || valor.trim() === '') {
      return { valido: false, mensagem: `O campo "${nomeCampo}" é obrigatório.` };
    }
    
    const numero = parseInt(valor.trim());
    if (isNaN(numero) || numero <= 0) {
      return { valido: false, mensagem: `O campo "${nomeCampo}" deve ser um número válido maior que zero.` };
    }
    
    return { valido: true };
  };

  const validarFormulario = (): boolean => {
    setModalError(''); // Limpar erro anterior
    
    // Validação: campos obrigatórios
    if (!codigoContaBanco.trim() || !codigoBanco.trim() || !codigoAgencia.trim() || !descricao.trim() || !numeroConta.trim()) {
      setModalError('Por favor, preencha todos os campos antes de salvar.');
      return false;
    }

    // Validação: Código Conta Banco (deve ser número positivo)
    const validacaoCodigoContaBanco = validarNumero(codigoContaBanco, 'Código Conta Banco');
    if (!validacaoCodigoContaBanco.valido) {
      const errorMsg = validacaoCodigoContaBanco.mensagem || 'Código Conta Banco inválido.';
      setModalError(errorMsg);
      return false;
    }

    // Validação: Código Banco (deve ser número positivo, geralmente 3 dígitos)
    const validacaoCodigoBanco = validarNumero(codigoBanco, 'Código Banco');
    if (!validacaoCodigoBanco.valido) {
      const errorMsg = validacaoCodigoBanco.mensagem || 'Código Banco inválido.';
      setModalError(errorMsg);
      return false;
    }
    const codigoBancoNum = parseInt(codigoBanco.trim());
    if (codigoBancoNum < 1 || codigoBancoNum > 999) {
      setModalError('O código do banco deve estar entre 1 e 999 (ex: 001 para BB, 341 para Itaú).');
      return false;
    }

    // Validação: Código Agência (deve ser número positivo)
    const validacaoCodigoAgencia = validarNumero(codigoAgencia, 'Código Agência');
    if (!validacaoCodigoAgencia.valido) {
      const errorMsg = validacaoCodigoAgencia.mensagem || 'Código Agência inválido.';
      setModalError(errorMsg);
      return false;
    }
    const codigoAgenciaNum = parseInt(codigoAgencia.trim());
    if (codigoAgenciaNum < 1 || codigoAgenciaNum > 99999) {
      setModalError('O código da agência deve estar entre 1 e 99999.');
      return false;
    }

    // Validação: Descrição (mínimo 1 caractere, máximo 40)
    const descricaoTrim = descricao.trim();
    if (descricaoTrim.length < 1) {
      setModalError('A descrição é obrigatória.');
      return false;
    }
    if (descricaoTrim.length > 40) {
      setModalError('A descrição deve ter no máximo 40 caracteres.');
      return false;
    }

    // Validação: Número da Conta (mínimo 1 caractere, máximo 20)
    const numeroContaTrim = numeroConta.trim();
    if (numeroContaTrim.length < 1) {
      setModalError('O número da conta é obrigatório.');
      return false;
    }
    if (numeroContaTrim.length > 20) {
      setModalError('O número da conta deve ter no máximo 20 caracteres.');
      return false;
    }

    return true;
  };

  const salvarConta = async () => {
    if (!validarFormulario() || !userId) return;

    try {
      const dadosConta = {
        codigo_conta_banco: parseInt(codigoContaBanco),
        codigo_empresa: userId,
        codigo_banco: parseInt(codigoBanco),
        codigo_agencia: parseInt(codigoAgencia),
        descricao: descricao.trim(),
        numero_conta: numeroConta.trim(),
      };

      if (editingConta) {
        await atualizarConta(editingConta.id!, dadosConta);
        fecharModal();
        await carregarContas(userId);
        showSuccess('Conta atualizada com sucesso!', { iconType: 'account' });
      } else {
        await criarConta(dadosConta);
        fecharModal();
        await carregarContas(userId);
        showSuccess('Conta criada com sucesso!', { iconType: 'account' });
      }
    } catch (error: any) {
      console.error('Erro ao salvar conta:', error);
      
      // Mensagens de erro mais específicas e amigáveis
      let mensagemErro = 'Não foi possível salvar a conta.';
      
      if (error.message) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          mensagemErro = 'Já existe uma conta com esses dados. Verifique as informações e tente novamente.';
        } else if (error.message.includes('foreign key') || error.message.includes('constraint')) {
          mensagemErro = 'Erro ao vincular a conta. Verifique se todos os dados estão corretos.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          mensagemErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          mensagemErro = error.message;
        }
      }
      
      // Mostrar erro dentro do modal (visual e toast)
      setModalError(mensagemErro);
      showError(mensagemErro);
    }
  };

  const confirmarDeletar = (conta: ContaBancaria) => {
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir a conta "${conta.descricao}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarConta(conta.id!);
              showSuccess('Conta excluída com sucesso!', { iconType: 'account' });
              if (userId) await carregarContas(userId);
            } catch (error: any) {
              console.error('Erro ao deletar conta:', error);
              showError(error.message || 'Não foi possível excluir a conta.');
            }
          },
        },
      ]
    );
  };

  const formatarNumeroConta = (numero: string) => {
    if (numero.length <= 4) return numero;
    return `****${numero.slice(-4)}`;
  };

  const getBankIcon = (bankCode: string) => {
    return 'building.columns.fill';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ThemedText style={styles.loadingText}>Carregando contas...</ThemedText>
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
        <Animated.View style={headerStyle}>
          <ScreenHeader
            title="Contas Bancárias"
            subtitle={`${contas.length} conta${contas.length !== 1 ? 's' : ''} conectada${contas.length !== 1 ? 's' : ''}`}
            rightAction={{
              icon: 'add',
              onPress: abrirModalAdicionar,
            }}
            showCompanySelector={true}
          />
        </Animated.View>

        <View style={styles.accountsList}>
          {contas.map((conta, index) => (
            <Animated.View
              key={conta.id}
              style={accountAnims[index] ? {
                opacity: accountAnims[index],
                transform: [
                  {
                    translateX: accountAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              } : { opacity: 0 }}>
              <GlassContainer style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.bankIcon}>
                  <IconSymbol name="building.columns.fill" size={24} color="#00b09b" />
                </View>
                <View style={styles.accountInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.accountName}>
                    {conta.descricao}
                  </ThemedText>
                  <ThemedText style={styles.accountType}>
                    Banco: {conta.codigo_banco} • Agência: {conta.codigo_agencia} • Conta: {formatarNumeroConta(conta.numero_conta)}
                  </ThemedText>
                </View>
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    onPress={() => abrirModalEditar(conta)}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="pencil" size={18} color="#00b09b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmarDeletar(conta)}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="trash" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.accountDetails}>
                <ThemedText style={styles.detailText}>
                  Código Conta Banco: {conta.codigo_conta_banco}
                </ThemedText>
              </View>
            </GlassContainer>
            </Animated.View>
          ))}
        </View>

        {contas.length === 0 && (
          <GlassContainer style={styles.emptyState}>
            <IconSymbol name="building.columns" size={48} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>
              Nenhuma conta cadastrada
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Adicione sua primeira conta bancária
            </ThemedText>
          </GlassContainer>
        )}

        <TouchableOpacity
          style={styles.addAccountCard}
          onPress={abrirModalAdicionar}
          activeOpacity={0.7}>
          <IconSymbol name="plus.circle.fill" size={32} color="#00b09b" />
          <Text style={styles.addAccountText}>
            Conectar Nova Conta
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Adicionar/Editar Conta */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={fecharModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <AnimatedBackground />
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>
                  {editingConta ? 'Editar Conta' : 'Nova Conta'}
                </ThemedText>
                <TouchableOpacity onPress={fecharModal} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Código Conta Banco</ThemedText>
                  <TextInput
                    value={codigoContaBanco}
                    onChangeText={(text) => {
                      // Permite apenas números
                      const numeros = text.replace(/[^0-9]/g, '');
                      setCodigoContaBanco(numeros);
                      setModalError(''); // Limpar erro ao editar
                    }}
                    placeholder="Ex: 1"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Código Banco</ThemedText>
                  <TextInput
                    value={codigoBanco}
                    onChangeText={(text) => {
                      // Permite apenas números
                      const numeros = text.replace(/[^0-9]/g, '');
                      setCodigoBanco(numeros);
                      setModalError(''); // Limpar erro ao editar
                    }}
                    placeholder="Ex: 001 (BB), 341 (Itaú), 237 (Bradesco)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    maxLength={3}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Código Agência</ThemedText>
                  <TextInput
                    value={codigoAgencia}
                    onChangeText={(text) => {
                      // Permite apenas números
                      const numeros = text.replace(/[^0-9]/g, '');
                      setCodigoAgencia(numeros);
                      setModalError(''); // Limpar erro ao editar
                    }}
                    placeholder="Ex: 1234"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    maxLength={5}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Descrição {descricao.length > 0 && `(${descricao.length}/40)`}
                  </ThemedText>
                  <TextInput
                    value={descricao}
                    onChangeText={(text) => {
                      setDescricao(text);
                      setModalError(''); // Limpar erro ao editar
                    }}
                    placeholder="Ex: Conta Corrente Principal"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={40}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Número da Conta {numeroConta.length > 0 && `(${numeroConta.length}/20)`}
                  </ThemedText>
                  <TextInput
                    value={numeroConta}
                    onChangeText={(text) => {
                      setNumeroConta(text);
                      setModalError(''); // Limpar erro ao editar
                    }}
                    placeholder="Ex: 12345-6"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={20}
                    style={styles.input}
                  />
                </View>

                {/* Error Message */}
                {modalError !== '' && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{modalError}</Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <Button
                    title={editingConta ? 'Atualizar' : 'Salvar'}
                    onPress={salvarConta}
                    style={styles.saveButton}
                  />
                  <Button
                    title="Cancelar"
                    onPress={fecharModal}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                </View>
              </View>
            </ScrollView>
            <Toast config={toastConfig} topOffset={60} />
          </View>
        </View>
      </Modal>
      <Toast config={toastConfig} topOffset={60} />
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
    color: '#FFFFFF',
    fontSize: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  accountsList: {
    gap: 16,
    marginBottom: 16,
  },
  accountCard: {
    padding: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: '#FFFFFF',
  },
  accountType: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  accountDetails: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  addAccountCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00b09b',
    borderStyle: 'dashed',
  },
  addAccountText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#00b09b',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
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
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
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
    gap: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#00b09b',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
  },
});
