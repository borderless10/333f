import React, { useEffect, useState, useMemo } from 'react';
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
import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import {
  buscarTitulos,
  criarTitulo,
  atualizarTitulo,
  deletarTitulo,
  marcarTituloComoPago,
  desmarcarTituloComoPago,
  type TitleWithAccount,
} from '@/lib/services/titles';
import { formatCurrency, formatCurrencyInput, parseCurrencyBRL } from '@/lib/utils/currency';

type FilterTipo = 'all' | 'pagar' | 'receber';
type FilterStatus = 'all' | 'pendente' | 'pago' | 'vencido';
type SortType = 'vencimento-desc' | 'vencimento-asc' | 'valor-desc' | 'valor-asc' | 'nome-asc' | 'nome-desc';

export default function TitlesScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { canEdit, canDelete, isViewerOnly } = usePermissions();

  const [titles, setTitles] = useState<TitleWithAccount[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTitle, setEditingTitle] = useState<TitleWithAccount | null>(null);

  // Filtros
  const [filterTipo, setFilterTipo] = useState<FilterTipo>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortType>('vencimento-desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário
  const [fornecedorCliente, setFornecedorCliente] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('R$ 0,00');
  const [dataVencimento, setDataVencimento] = useState('');
  const [tipo, setTipo] = useState<'pagar' | 'receber'>('pagar');
  const [contaBancariaId, setContaBancariaId] = useState<number | null>(null);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) {
      console.log('📋 Títulos: Aguardando userId...');
      setLoading(false);
      setTitles([]);
      setContas([]);
      return;
    }

    try {
      console.log('📋 Títulos: Carregando dados para userId:', userId);
      setLoading(true);
      const [titlesResult, contasResult] = await Promise.all([
        buscarTitulos(userId),
        buscarContas(userId),
      ]);

      if (titlesResult.error) {
        console.error('❌ Erro ao buscar títulos:', titlesResult.error);
        setTitles([]);
      } else if (titlesResult.data) {
        console.log('✅ Títulos carregados:', titlesResult.data.length);
        setTitles(titlesResult.data);
      } else {
        setTitles([]);
      }

      if (contasResult) {
        console.log('✅ Contas carregadas:', contasResult.length);
        setContas(contasResult);
      } else {
        setContas([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setTitles([]);
      setContas([]);
    } finally {
      setLoading(false);
    }
  };

  const openModalAdd = () => {
    if (isViewerOnly) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para adicionar títulos.');
      return;
    }

    setEditingTitle(null);
    resetForm();
    setModalVisible(true);
  };

  const openModalEdit = (title: TitleWithAccount) => {
    if (!canEdit) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para editar títulos.');
      return;
    }

    setEditingTitle(title);
    setFornecedorCliente(title.fornecedor_cliente);
    setDescricao(title.descricao || '');
    setValor(formatCurrency(title.valor));
    setDataVencimento(title.data_vencimento);
    setTipo(title.tipo);
    setContaBancariaId(title.conta_bancaria_id || null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingTitle(null);
    setModalError('');
  };

  const resetForm = () => {
    setFornecedorCliente('');
    setDescricao('');
    setValor('R$ 0,00');
    setDataVencimento('');
    setTipo('pagar');
    setContaBancariaId(null);
    setModalError('');
  };

  const validateForm = (): boolean => {
    if (!fornecedorCliente.trim()) {
      setModalError('Fornecedor/Cliente é obrigatório');
      return false;
    }

    const valorNumerico = parseCurrencyBRL(valor);
    if (valorNumerico <= 0) {
      setModalError('Valor deve ser maior que zero');
      return false;
    }

    if (!dataVencimento) {
      setModalError('Data de vencimento é obrigatória');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !userId) return;

    try {
      const titleData = {
        codigo_empresa: userId,
        fornecedor_cliente: fornecedorCliente.trim(),
        descricao: descricao.trim() || undefined,
        valor: parseCurrencyBRL(valor),
        data_vencimento: dataVencimento,
        tipo,
        conta_bancaria_id: contaBancariaId,
      };

      if (editingTitle) {
        await atualizarTitulo(editingTitle.id!, titleData);
        Alert.alert('Sucesso', 'Título atualizado com sucesso!');
      } else {
        await criarTitulo(titleData);
        Alert.alert('Sucesso', 'Título criado com sucesso!');
      }

      closeModal();
      await loadData();
    } catch (error: any) {
      console.error('Erro ao salvar título:', error);
      setModalError(error.message || 'Erro ao salvar título');
    }
  };

  const handleMarkAsPaid = async (title: TitleWithAccount) => {
    if (!canEdit || !userId) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para marcar títulos como pagos.');
      return;
    }

    try {
      await marcarTituloComoPago(userId, title.id!, undefined, title.conta_bancaria_id || undefined);
      Alert.alert('Sucesso', 'Título marcado como pago e transação criada!');
      await loadData();
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error);
      Alert.alert('Erro', error.message || 'Não foi possível marcar como pago');
    }
  };

  const handleUnmarkAsPaid = async (title: TitleWithAccount) => {
    if (!canEdit) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para desmarcar títulos.');
      return;
    }

    Alert.alert(
      'Desmarcar como pago',
      'Deseja realmente desmarcar este título como pago?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desmarcar',
          onPress: async () => {
            try {
              await desmarcarTituloComoPago(title.id!);
              Alert.alert('Sucesso', 'Título desmarcado como pago!');
              await loadData();
            } catch (error: any) {
              console.error('Erro ao desmarcar:', error);
              Alert.alert('Erro', error.message || 'Não foi possível desmarcar');
            }
          },
        },
      ]
    );
  };

  const confirmDelete = (title: TitleWithAccount) => {
    if (!canDelete) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para deletar títulos.');
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o título "${title.fornecedor_cliente}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarTitulo(title.id!);
              Alert.alert('Sucesso', 'Título excluído com sucesso!');
              await loadData();
            } catch (error: any) {
              console.error('Erro ao deletar título:', error);
              Alert.alert('Erro', error.message || 'Não foi possível excluir o título');
            }
          },
        },
      ]
    );
  };

  // Filtros e ordenação
  const filteredAndSortedTitles = useMemo(() => {
    let result = titles.filter((title) => {
      // Filtro por tipo
      const matchesTipo = filterTipo === 'all' || title.tipo === filterTipo;

      // Filtro por status
      const matchesStatus = filterStatus === 'all' || title.status === filterStatus;

      // Filtro por busca
      const matchesSearch =
        searchQuery.trim() === '' ||
        title.fornecedor_cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        title.descricao?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTipo && matchesStatus && matchesSearch;
    });

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case 'vencimento-desc':
          return new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime();
        case 'vencimento-asc':
          return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
        case 'valor-desc':
          return b.valor - a.valor;
        case 'valor-asc':
          return a.valor - b.valor;
        case 'nome-asc':
          return a.fornecedor_cliente.localeCompare(b.fornecedor_cliente);
        case 'nome-desc':
          return b.fornecedor_cliente.localeCompare(a.fornecedor_cliente);
        default:
          return 0;
      }
    });

    return result;
  }, [titles, filterTipo, filterStatus, searchQuery, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return '#10B981';
      case 'vencido':
        return '#EF4444';
      case 'pendente':
        return '#FBBF24';
      default:
        return '#9CA3AF';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'rgba(16, 185, 129, 0.2)';
      case 'vencido':
        return 'rgba(239, 68, 68, 0.2)';
      case 'pendente':
        return 'rgba(251, 191, 36, 0.2)';
      default:
        return 'rgba(156, 163, 175, 0.2)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago':
        return 'Pago';
      case 'vencido':
        return 'Vencido';
      case 'pendente':
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
          <ThemedText style={styles.loadingText}>Carregando títulos...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Títulos
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {titles.length} título{titles.length !== 1 ? 's' : ''} cadastrado{titles.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {/* Search Bar */}
        <GlassContainer style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol name="magnifyingglass" size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por fornecedor/cliente ou descrição..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark.circle.fill" size={20} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </GlassContainer>

        {/* Sort */}
        <GlassContainer style={styles.sortContainer}>
          <IconSymbol name="arrow.up.arrow.down" size={16} color="rgba(255, 255, 255, 0.6)" />
          <TouchableOpacity
            onPress={() => {
              const sortOptions: SortType[] = [
                'vencimento-desc',
                'vencimento-asc',
                'valor-desc',
                'valor-asc',
                'nome-asc',
                'nome-desc',
              ];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              setSortBy(sortOptions[nextIndex]);
            }}
            style={styles.sortButton}>
            <Text style={styles.sortText}>{getSortLabel(sortBy)}</Text>
          </TouchableOpacity>
        </GlassContainer>

        {/* Filters - Tipo */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filterTipo === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterTipo('all')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterTipo === 'all' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterTipo === 'pagar' && styles.filterButtonActive]}
            onPress={() => setFilterTipo('pagar')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterTipo === 'pagar' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              A Pagar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterTipo === 'receber' && styles.filterButtonActive]}
            onPress={() => setFilterTipo('receber')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterTipo === 'receber' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              A Receber
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filters - Status */}
        <View style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'all' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pendente' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pendente')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'pendente' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Pendente
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'pago' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('pago')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'pago' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Pago
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'vencido' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('vencido')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'vencido' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Vencido
            </Text>
          </TouchableOpacity>
        </View>

        {/* Titles List */}
        {filteredAndSortedTitles.length === 0 ? (
          <GlassContainer style={styles.emptyState}>
            <IconSymbol name="creditcard" size={48} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>Nenhum título encontrado</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery ? 'Tente buscar com outros termos' : 'Adicione seu primeiro título'}
            </ThemedText>
          </GlassContainer>
        ) : (
          <View style={styles.titlesList}>
            {filteredAndSortedTitles.map((title) => {
              const contaDescricao = title.contas_bancarias?.descricao || 'Sem conta';

              return (
                <GlassContainer key={title.id} style={styles.titleCard}>
                  <View style={styles.titleHeader}>
                    <View style={styles.titleIcon}>
                      <IconSymbol
                        name={title.tipo === 'pagar' ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill'}
                        size={24}
                        color={title.tipo === 'pagar' ? '#EF4444' : '#10B981'}
                      />
                    </View>
                    <View style={styles.titleInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.titleName}>
                        {title.fornecedor_cliente}
                      </ThemedText>
                      {title.descricao && (
                        <ThemedText style={styles.titleDescription}>{title.descricao}</ThemedText>
                      )}
                      <ThemedText style={styles.titleMeta}>
                        {contaDescricao} • Vence: {formatDate(title.data_vencimento)}
                      </ThemedText>
                    </View>
                    <View style={styles.titleRight}>
                      <Text
                        style={[
                          styles.titleValue,
                          { color: title.tipo === 'pagar' ? '#EF4444' : '#10B981' },
                        ]}>
                        {formatCurrency(title.valor)}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusBgColor(title.status) },
                        ]}>
                        <Text style={[styles.statusText, { color: getStatusColor(title.status) }]}>
                          {getStatusLabel(title.status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {(canEdit || canDelete) && (
                    <View style={styles.actionsRow}>
                      {canEdit && title.status !== 'pago' && (
                        <TouchableOpacity
                          onPress={() => handleMarkAsPaid(title)}
                          style={styles.actionButton}
                          activeOpacity={0.7}>
                          <IconSymbol name="checkmark.circle" size={16} color="#10B981" />
                          <Text style={[styles.actionButtonText, { color: '#10B981' }]}>
                            Marcar como Pago
                          </Text>
                        </TouchableOpacity>
                      )}
                      {canEdit && title.status === 'pago' && (
                        <TouchableOpacity
                          onPress={() => handleUnmarkAsPaid(title)}
                          style={styles.actionButton}
                          activeOpacity={0.7}>
                          <IconSymbol name="arrow.counterclockwise" size={16} color="#FBBF24" />
                          <Text style={[styles.actionButtonText, { color: '#FBBF24' }]}>
                            Desmarcar
                          </Text>
                        </TouchableOpacity>
                      )}
                      {canEdit && (
                        <TouchableOpacity
                          onPress={() => openModalEdit(title)}
                          style={styles.actionButton}
                          activeOpacity={0.7}>
                          <IconSymbol name="pencil" size={16} color="#00b09b" />
                          <Text style={styles.actionButtonText}>Editar</Text>
                        </TouchableOpacity>
                      )}
                      {canDelete && (
                        <TouchableOpacity
                          onPress={() => confirmDelete(title)}
                          style={[styles.actionButton, styles.actionButtonDanger]}
                          activeOpacity={0.7}>
                          <IconSymbol name="trash" size={16} color="#EF4444" />
                          <Text style={styles.actionButtonTextDanger}>Excluir</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </GlassContainer>
              );
            })}
          </View>
        )}

        {/* Add Button */}
        {!isViewerOnly && (
          <TouchableOpacity style={styles.addButton} onPress={openModalAdd} activeOpacity={0.7}>
            <IconSymbol name="plus.circle.fill" size={32} color="#00b09b" />
            <Text style={styles.addButtonText}>Adicionar Título</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal de Adicionar/Editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <AnimatedBackground />
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>
                  {editingTitle ? 'Editar Título' : 'Novo Título'}
                </ThemedText>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                {/* Tipo */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Tipo *</ThemedText>
                  <View style={styles.typeButtons}>
                    <TouchableOpacity
                      style={[styles.typeButton, tipo === 'pagar' && styles.typeButtonActive]}
                      onPress={() => setTipo('pagar')}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.typeButtonText,
                          tipo === 'pagar' && styles.typeButtonTextActive,
                        ]}>
                        A Pagar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, tipo === 'receber' && styles.typeButtonActive]}
                      onPress={() => setTipo('receber')}
                      activeOpacity={0.7}>
                      <Text
                        style={[
                          styles.typeButtonText,
                          tipo === 'receber' && styles.typeButtonTextActive,
                        ]}>
                        A Receber
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Fornecedor/Cliente */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    {tipo === 'pagar' ? 'Fornecedor' : 'Cliente'} * ({fornecedorCliente.length}/100)
                  </ThemedText>
                  <TextInput
                    value={fornecedorCliente}
                    onChangeText={(text) => {
                      setFornecedorCliente(text);
                      setModalError('');
                    }}
                    placeholder={tipo === 'pagar' ? 'Nome do fornecedor' : 'Nome do cliente'}
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={100}
                    style={styles.input}
                  />
                </View>

                {/* Descrição */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Descrição ({descricao.length}/200)</ThemedText>
                  <TextInput
                    value={descricao}
                    onChangeText={setDescricao}
                    placeholder="Detalhes do título (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={200}
                    style={styles.input}
                  />
                </View>

                {/* Valor */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Valor *</ThemedText>
                  <TextInput
                    value={valor}
                    onChangeText={(text) => {
                      const formatted = formatCurrencyInput(text);
                      setValor(formatted);
                      setModalError('');
                    }}
                    placeholder="R$ 0,00"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                {/* Data de Vencimento */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Data de Vencimento *</ThemedText>
                  <TextInput
                    value={dataVencimento}
                    onChangeText={(text) => {
                      // Formata como YYYY-MM-DD
                      let formatted = text.replace(/\D/g, '');
                      if (formatted.length >= 4) {
                        formatted = formatted.slice(0, 4) + '-' + formatted.slice(4);
                      }
                      if (formatted.length >= 7) {
                        formatted = formatted.slice(0, 7) + '-' + formatted.slice(7, 9);
                      }
                      setDataVencimento(formatted);
                      setModalError('');
                    }}
                    placeholder="YYYY-MM-DD (ex: 2024-12-31)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    maxLength={10}
                    style={styles.input}
                  />
                </View>

                {/* Conta Bancária */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Conta Bancária</ThemedText>
                  <View style={styles.pickerContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        // Cicla entre contas ou "Sem conta"
                        if (contaBancariaId === null) {
                          setContaBancariaId(contas[0]?.id || null);
                        } else {
                          const currentIndex = contas.findIndex((c) => c.id === contaBancariaId);
                          if (currentIndex === contas.length - 1) {
                            setContaBancariaId(null);
                          } else {
                            setContaBancariaId(contas[currentIndex + 1]?.id || null);
                          }
                        }
                      }}
                      style={styles.pickerButton}>
                      <Text style={styles.pickerText}>
                        {contaBancariaId
                          ? contas.find((c) => c.id === contaBancariaId)?.descricao || 'Sem conta'
                          : 'Sem conta'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Error Message */}
                {modalError !== '' && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{modalError}</Text>
                  </View>
                )}

                {/* Actions */}
                <View style={styles.modalActions}>
                  <Button
                    title={editingTitle ? 'Atualizar' : 'Salvar'}
                    onPress={handleSave}
                    style={styles.saveButton}
                  />
                  <Button
                    title="Cancelar"
                    onPress={closeModal}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getSortLabel(sortBy: SortType): string {
  const labels: Record<SortType, string> = {
    'vencimento-desc': 'Vencimento ↓',
    'vencimento-asc': 'Vencimento ↑',
    'valor-desc': 'Valor ↓',
    'valor-asc': 'Valor ↑',
    'nome-asc': 'Nome A-Z',
    'nome-desc': 'Nome Z-A',
  };
  return labels[sortBy];
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
  searchContainer: {
    marginBottom: 12,
    padding: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  sortButton: {
    flex: 1,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#00b09b',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  titlesList: {
    gap: 16,
    marginBottom: 16,
  },
  titleCard: {
    padding: 16,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleInfo: {
    flex: 1,
  },
  titleName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  titleDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  titleMeta: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  titleRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  titleValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
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
  actionButtonText: {
    color: '#00b09b',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
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
    textAlign: 'center',
  },
  addButton: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#00b09b',
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#00b09b',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    flex: 1,
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
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#00b09b',
    borderColor: '#00b09b',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  pickerText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#00b09b',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
