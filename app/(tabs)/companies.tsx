import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import { useScreenAnimations } from '@/hooks/use-screen-animations';
import {
  buscarEmpresas,
  criarEmpresa,
  atualizarEmpresa,
  deletarEmpresa,
  validarCNPJ,
  formatarCNPJ,
  limparCNPJ,
  formatarCEP,
  formatarTelefone,
  validarEmail,
  type Company,
} from '@/lib/services/companies';

type FilterStatus = 'all' | 'active' | 'inactive';

export default function CompaniesScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { selectedCompany } = useCompany();
  const { canEdit, canDelete, isViewerOnly } = usePermissions();
  const scrollRef = useScrollToTop(); // ✅ Hook para resetar scroll
  const { animatedStyle: headerStyle } = useScreenAnimations(0);
  const { animatedStyle: searchStyle } = useScreenAnimations(100);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Formulário
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cep, setCep] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [ativa, setAtiva] = useState(true);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    loadCompanies();
  }, [userId, selectedCompany]);

  const loadCompanies = async () => {
    if (!userId) {
      console.log('🏢 Empresas: Aguardando userId...');
      setLoading(false);
      setCompanies([]);
      return;
    }

    try {
      console.log('🏢 Empresas: Carregando dados para userId:', userId);
      setLoading(true);
      const { data, error } = await buscarEmpresas(userId);

      if (error) {
        console.error('❌ Erro ao buscar empresas:', error);
        setCompanies([]);
        setLoading(false);
        return;
      }

      if (data) {
        console.log('✅ Empresas carregadas:', data.length);
        setCompanies(data);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const openModalAdd = () => {
    if (isViewerOnly) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para adicionar empresas.');
      return;
    }

    setEditingCompany(null);
    resetForm();
    setModalVisible(true);
  };

  const openModalEdit = (company: Company) => {
    if (!canEdit) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para editar empresas.');
      return;
    }

    setEditingCompany(company);
    setRazaoSocial(company.razao_social);
    setNomeFantasia(company.nome_fantasia || '');
    setCnpj(formatarCNPJ(company.cnpj));
    setInscricaoEstadual(company.inscricao_estadual || '');
    setInscricaoMunicipal(company.inscricao_municipal || '');
    setEndereco(company.endereco || '');
    setCidade(company.cidade || '');
    setEstado(company.estado || '');
    setCep(company.cep ? formatarCEP(company.cep) : '');
    setTelefone(company.telefone ? formatarTelefone(company.telefone) : '');
    setEmail(company.email || '');
    setObservacoes(company.observacoes || '');
    setAtiva(company.ativa);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCompany(null);
    setModalError('');
    resetForm();
  };

  const resetForm = () => {
    setRazaoSocial('');
    setNomeFantasia('');
    setCnpj('');
    setInscricaoEstadual('');
    setInscricaoMunicipal('');
    setEndereco('');
    setCidade('');
    setEstado('');
    setCep('');
    setTelefone('');
    setEmail('');
    setObservacoes('');
    setAtiva(true);
    setModalError('');
  };

  const validateForm = (): boolean => {
    // Campos obrigatórios
    if (!razaoSocial.trim()) {
      setModalError('Razão Social é obrigatória');
      return false;
    }

    if (!cnpj.trim()) {
      setModalError('CNPJ é obrigatório');
      return false;
    }

    // Valida CNPJ
    if (!validarCNPJ(cnpj)) {
      setModalError('CNPJ inválido');
      return false;
    }

    // Valida email se preenchido
    if (email.trim() && !validarEmail(email)) {
      setModalError('Email inválido');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !userId) return;

    try {
      const companyData = {
        codigo_empresa: userId,
        razao_social: razaoSocial.trim(),
        nome_fantasia: nomeFantasia.trim() || undefined,
        cnpj: limparCNPJ(cnpj),
        inscricao_estadual: inscricaoEstadual.trim() || undefined,
        inscricao_municipal: inscricaoMunicipal.trim() || undefined,
        endereco: endereco.trim() || undefined,
        cidade: cidade.trim() || undefined,
        estado: estado.trim() || undefined,
        cep: cep.replace(/\D/g, '') || undefined,
        telefone: telefone.replace(/\D/g, '') || undefined,
        email: email.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        ativa,
      };

      if (editingCompany) {
        await atualizarEmpresa(editingCompany.id!, companyData);
        Alert.alert('Sucesso', 'Empresa atualizada com sucesso!');
      } else {
        await criarEmpresa(companyData);
        Alert.alert('Sucesso', 'Empresa criada com sucesso!');
      }

      closeModal();
      await loadCompanies();
    } catch (error: any) {
      console.error('Erro ao salvar empresa:', error);
      setModalError(error.message || 'Erro ao salvar empresa');
    }
  };

  const confirmDelete = (company: Company) => {
    if (!canDelete) {
      Alert.alert('Acesso Negado', 'Você não tem permissão para deletar empresas.');
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir a empresa "${company.razao_social}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarEmpresa(company.id!);
              Alert.alert('Sucesso', 'Empresa excluída com sucesso!');
              await loadCompanies();
            } catch (error: any) {
              console.error('Erro ao deletar empresa:', error);
              Alert.alert('Erro', error.message || 'Não foi possível excluir a empresa');
            }
          },
        },
      ]
    );
  };

  // Filtros
  const filteredCompanies = companies.filter((company) => {
    // Filtro por status
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && company.ativa) ||
      (filterStatus === 'inactive' && !company.ativa);

    // Filtro por busca
    const matchesSearch =
      searchQuery.trim() === '' ||
      company.razao_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.nome_fantasia?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.cnpj.includes(searchQuery.replace(/\D/g, ''));

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ActivityIndicator size="large" color="#00b09b" />
          <ThemedText style={styles.loadingText}>Carregando empresas...</ThemedText>
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
            title="Empresas"
            subtitle={`${companies.length} empresa${companies.length !== 1 ? 's' : ''} cadastrada${companies.length !== 1 ? 's' : ''}`}
            rightAction={{
              icon: 'add',
              onPress: openModalAdd,
              visible: !isViewerOnly,
            }}
            showCompanySelector={true}
          />
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={searchStyle}>
          <GlassContainer style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol name="magnifyingglass" size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por razão social, nome ou CNPJ..."
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
        </Animated.View>

        {/* Filters */}
        <Animated.View style={[styles.filters, searchStyle]}>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('all')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'all' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'active' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('active')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'active' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Ativas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filterStatus === 'inactive' && styles.filterButtonActive]}
            onPress={() => setFilterStatus('inactive')}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterText,
                filterStatus === 'inactive' ? styles.filterTextActive : styles.filterTextInactive,
              ]}>
              Inativas
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <GlassContainer style={styles.emptyState}>
            <IconSymbol name="building.2" size={48} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>Nenhuma empresa encontrada</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery ? 'Tente buscar com outros termos' : 'Adicione sua primeira empresa'}
            </ThemedText>
          </GlassContainer>
        ) : (
          <View style={styles.companiesList}>
            {filteredCompanies.map((company) => (
              <GlassContainer key={company.id} style={styles.companyCard}>
                <View style={styles.companyHeader}>
                  <View style={styles.companyIcon}>
                    <IconSymbol name="building.2" size={24} color="#00b09b" />
                  </View>
                  <View style={styles.companyInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.companyName}>
                      {company.razao_social}
                    </ThemedText>
                    {company.nome_fantasia && (
                      <ThemedText style={styles.companyFantasia}>{company.nome_fantasia}</ThemedText>
                    )}
                    <ThemedText style={styles.companyMeta}>
                      CNPJ: {formatarCNPJ(company.cnpj)}
                    </ThemedText>
                  </View>
                  <View style={styles.companyActions}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: company.ativa ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)' },
                      ]}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: company.ativa ? '#10B981' : '#9CA3AF' },
                        ]}>
                        {company.ativa ? 'Ativa' : 'Inativa'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.companyDetails}>
                  {company.cidade && company.estado && (
                    <ThemedText style={styles.detailText}>
                      📍 {company.cidade}/{company.estado}
                    </ThemedText>
                  )}
                  {company.telefone && (
                    <ThemedText style={styles.detailText}>
                      📞 {formatarTelefone(company.telefone)}
                    </ThemedText>
                  )}
                  {company.email && (
                    <ThemedText style={styles.detailText}>
                      ✉️ {company.email}
                    </ThemedText>
                  )}
                </View>
                {(canEdit || canDelete) && (
                  <View style={styles.actionsRow}>
                    {canEdit && (
                      <TouchableOpacity
                        onPress={() => openModalEdit(company)}
                        style={styles.actionButton}
                        activeOpacity={0.7}>
                        <IconSymbol name="pencil" size={16} color="#00b09b" />
                        <Text style={styles.actionButtonText}>Editar</Text>
                      </TouchableOpacity>
                    )}
                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => confirmDelete(company)}
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        activeOpacity={0.7}>
                        <IconSymbol name="trash" size={16} color="#EF4444" />
                        <Text style={styles.actionButtonTextDanger}>Excluir</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </GlassContainer>
            ))}
          </View>
        )}

        {/* Add Button */}
        {!isViewerOnly && (
          <TouchableOpacity style={styles.addButton} onPress={openModalAdd} activeOpacity={0.7}>
            <IconSymbol name="plus.circle.fill" size={32} color="#00b09b" />
            <Text style={styles.addButtonText}>Adicionar Empresa</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal de Adicionar/Editar */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
            <AnimatedBackground />
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <ThemedText type="title" style={styles.modalTitle}>
                  {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
                </ThemedText>
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeButton}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  activeOpacity={0.7}>
                  <IconSymbol name="xmark.circle.fill" size={32} color="rgba(255, 255, 255, 0.9)" />
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                {/* Razão Social */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Razão Social * ({razaoSocial.length}/100)
                  </ThemedText>
                  <TextInput
                    value={razaoSocial}
                    onChangeText={(text) => {
                      setRazaoSocial(text);
                      setModalError('');
                    }}
                    placeholder="Nome oficial da empresa"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={100}
                    style={styles.input}
                  />
                </View>

                {/* Nome */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Nome ({nomeFantasia.length}/100)
                  </ThemedText>
                  <TextInput
                    value={nomeFantasia}
                    onChangeText={setNomeFantasia}
                    placeholder="Nome comercial (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={100}
                    style={styles.input}
                  />
                </View>

                {/* CNPJ */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>CNPJ *</ThemedText>
                  <TextInput
                    value={cnpj}
                    onChangeText={(text) => {
                      const formatted = formatarCNPJ(text);
                      setCnpj(formatted);
                      setModalError('');
                    }}
                    placeholder="00.000.000/0000-00"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    maxLength={18}
                    style={styles.input}
                  />
                </View>

                {/* Inscrição Estadual */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Inscrição Estadual</ThemedText>
                  <TextInput
                    value={inscricaoEstadual}
                    onChangeText={setInscricaoEstadual}
                    placeholder="Número da inscrição estadual (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={20}
                    style={styles.input}
                  />
                </View>

                {/* Inscrição Municipal */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Inscrição Municipal</ThemedText>
                  <TextInput
                    value={inscricaoMunicipal}
                    onChangeText={setInscricaoMunicipal}
                    placeholder="Número da inscrição municipal (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={20}
                    style={styles.input}
                  />
                </View>

                {/* Endereço */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Endereço ({endereco.length}/200)</ThemedText>
                  <TextInput
                    value={endereco}
                    onChangeText={setEndereco}
                    placeholder="Rua, número, complemento (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={200}
                    style={styles.input}
                  />
                </View>

                {/* Cidade */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Cidade ({cidade.length}/100)</ThemedText>
                  <TextInput
                    value={cidade}
                    onChangeText={setCidade}
                    placeholder="Nome da cidade (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={100}
                    style={styles.input}
                  />
                </View>

                {/* Estado */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Estado</ThemedText>
                  <TextInput
                    value={estado}
                    onChangeText={(text) => setEstado(text.toUpperCase())}
                    placeholder="UF (ex: SP, RJ, MG)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={2}
                    autoCapitalize="characters"
                    style={styles.input}
                  />
                </View>

                {/* CEP */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>CEP</ThemedText>
                  <TextInput
                    value={cep}
                    onChangeText={(text) => setCep(formatarCEP(text))}
                    placeholder="00000-000"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="numeric"
                    maxLength={9}
                    style={styles.input}
                  />
                </View>

                {/* Telefone */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Telefone</ThemedText>
                  <TextInput
                    value={telefone}
                    onChangeText={(text) => setTelefone(formatarTelefone(text))}
                    placeholder="(00) 00000-0000"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="phone-pad"
                    maxLength={15}
                    style={styles.input}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>Email ({email.length}/100)</ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setModalError('');
                    }}
                    placeholder="contato@empresa.com.br (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    maxLength={100}
                    style={styles.input}
                  />
                </View>

                {/* Observações */}
                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel}>
                    Observações ({observacoes.length}/500)
                  </ThemedText>
                  <TextInput
                    value={observacoes}
                    onChangeText={setObservacoes}
                    placeholder="Informações adicionais (opcional)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    maxLength={500}
                    multiline
                    numberOfLines={4}
                    style={[styles.input, styles.textArea]}
                  />
                </View>

                {/* Status Ativa/Inativa */}
                <View style={styles.switchContainer}>
                  <ThemedText style={styles.inputLabel}>Status</ThemedText>
                  <TouchableOpacity
                    onPress={() => setAtiva(!ativa)}
                    style={styles.switchButton}
                    activeOpacity={0.7}>
                    <View style={[styles.switchTrack, ativa && styles.switchTrackActive]}>
                      <View style={[styles.switchThumb, ativa && styles.switchThumbActive]} />
                    </View>
                    <Text style={styles.switchText}>{ativa ? 'Ativa' : 'Inativa'}</Text>
                  </TouchableOpacity>
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
                    title={editingCompany ? 'Atualizar' : 'Salvar'}
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: '#00b09b',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextInactive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  companiesList: {
    gap: 16,
    marginBottom: 16,
  },
  companyCard: {
    padding: 16,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  companyFantasia: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  companyMeta: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 4,
  },
  companyActions: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  companyDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
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
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
    fontSize: 14,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
    maxHeight: '95%',
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchTrack: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 2,
  },
  switchTrackActive: {
    backgroundColor: '#00b09b',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  switchText: {
    fontSize: 16,
    fontWeight: '600',
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
