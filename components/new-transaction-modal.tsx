import React, { useState, useEffect } from 'react';
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
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Button } from './ui/button';
import { criarTransacao, type Transaction } from '@/lib/services/transactions';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import { useAuth } from '@/contexts/AuthContext';

interface NewTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewTransactionModal({ visible, onClose, onSuccess }: NewTransactionModalProps) {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  
  // Formulário
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [data, setData] = useState('');
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [categoria, setCategoria] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState<number | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadAccounts();
      // Definir data padrão como hoje
      const today = new Date();
      setData(today.toISOString().split('T')[0]);
      // Limpar formulário
      resetForm();
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

  const resetForm = () => {
    setDescricao('');
    setValor('');
    const today = new Date();
    setData(today.toISOString().split('T')[0]);
    setTipo('receita');
    setCategoria('');
    setContaBancariaId(null);
  };

  const handleSave = async () => {
    // Validações
    if (!descricao.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a descrição.');
      return;
    }

    if (!valor.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o valor.');
      return;
    }

    const valorNum = parseFloat(valor.replace(/[^\d,.-]/g, '').replace(',', '.'));
    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido maior que zero.');
      return;
    }

    if (!data) {
      Alert.alert('Erro', 'Por favor, selecione uma data.');
      return;
    }

    if (!categoria.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a categoria.');
      return;
    }

    if (!userId) {
      Alert.alert('Erro', 'Usuário não identificado.');
      return;
    }

    try {
      setLoading(true);

      const transacao: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
        codigo_empresa: userId,
        descricao: descricao.trim(),
        valor: valorNum,
        data,
        tipo,
        categoria: categoria.trim(),
        conta_bancaria_id: contaBancariaId,
      };

      await criarTransacao(transacao);
      
      Alert.alert('Sucesso', 'Transação criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.();
            handleClose();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      Alert.alert('Erro', error.message || 'Não foi possível criar a transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const formatCurrencyInput = (text: string) => {
    // Remove tudo exceto números, vírgula e ponto
    const cleaned = text.replace(/[^\d,.-]/g, '');
    setValor(cleaned);
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
              Nova Transação
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
          <GlassContainer style={styles.formCard}>
            {/* Tipo de Transação */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Tipo de Transação *</ThemedText>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tipo === 'receita' && styles.typeButtonActive,
                    tipo === 'receita' && { backgroundColor: '#10B98120', borderColor: '#10B981' },
                  ]}
                  onPress={() => setTipo('receita')}
                  activeOpacity={0.7}>
                  <IconSymbol name="arrow.up.circle.fill" size={20} color={tipo === 'receita' ? '#10B981' : 'rgba(255, 255, 255, 0.6)'} />
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      tipo === 'receita' && { color: '#10B981', fontWeight: '600' },
                    ]}>
                    Receita
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    tipo === 'despesa' && styles.typeButtonActive,
                    tipo === 'despesa' && { backgroundColor: '#EF444420', borderColor: '#EF4444' },
                  ]}
                  onPress={() => setTipo('despesa')}
                  activeOpacity={0.7}>
                  <IconSymbol name="arrow.down.circle.fill" size={20} color={tipo === 'despesa' ? '#EF4444' : 'rgba(255, 255, 255, 0.6)'} />
                  <ThemedText
                    style={[
                      styles.typeButtonText,
                      tipo === 'despesa' && { color: '#EF4444', fontWeight: '600' },
                    ]}>
                    Despesa
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Descrição *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ex: Pagamento fornecedor XYZ"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={descricao}
                onChangeText={setDescricao}
                autoCapitalize="words"
              />
            </View>

            {/* Valor */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Valor *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={valor}
                onChangeText={formatCurrencyInput}
                keyboardType="numeric"
              />
            </View>

            {/* Data */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Data *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={data}
                onChangeText={setData}
              />
            </View>

            {/* Categoria */}
            <View style={styles.section}>
              <ThemedText style={styles.label}>Categoria *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Ex: Fornecedores, Vendas, Salários..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={categoria}
                onChangeText={setCategoria}
                autoCapitalize="words"
              />
            </View>

            {/* Conta Bancária (Opcional) */}
            {contas.length > 0 && (
              <View style={styles.section}>
                <ThemedText style={styles.label}>Conta Bancária (opcional)</ThemedText>
                <View style={styles.accountButtons}>
                  <TouchableOpacity
                    style={[
                      styles.accountButton,
                      contaBancariaId === null && styles.accountButtonActive,
                    ]}
                    onPress={() => setContaBancariaId(null)}
                    activeOpacity={0.7}>
                    <ThemedText
                      style={[
                        styles.accountButtonText,
                        contaBancariaId === null && styles.accountButtonTextActive,
                      ]}>
                      Nenhuma
                    </ThemedText>
                  </TouchableOpacity>
                  {contas.map((conta) => (
                    <TouchableOpacity
                      key={conta.id}
                      style={[
                        styles.accountButton,
                        contaBancariaId === conta.id && styles.accountButtonActive,
                      ]}
                      onPress={() => setContaBancariaId(conta.id || null)}
                      activeOpacity={0.7}>
                      <ThemedText
                        style={[
                          styles.accountButtonText,
                          contaBancariaId === conta.id && styles.accountButtonTextActive,
                        ]}>
                        {conta.descricao}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Botões */}
            <View style={styles.actions}>
              <Button
                title="Cancelar"
                onPress={handleClose}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Salvar Transação"
                onPress={handleSave}
                loading={loading}
                style={styles.button}
              />
            </View>
          </GlassContainer>
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
  formCard: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
  },
  typeButtonActive: {
    borderWidth: 2,
  },
  typeButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  accountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  accountButtonActive: {
    backgroundColor: '#00b09b20',
    borderColor: '#00b09b',
  },
  accountButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  accountButtonTextActive: {
    color: '#00b09b',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
  },
});
