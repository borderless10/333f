import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import {
  atualizarPerfil,
  buscarUsuariosComPerfis,
  criarNovoUsuario,
  criarPerfil,
  deletarUsuarioPermanentemente,
  getRoleColor,
  getRoleDescription,
  getRoleName,
  type UserRole,
  type UserWithProfile
} from '@/lib/services/profiles';
import { router } from 'expo-router';
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

type FilterRole = 'all' | 'admin' | 'analista' | 'viewer' | 'no_profile';

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const { userId, refreshUserRole } = useAuth();
  const { isAdmin } = usePermissions();
  const scrollRef = useScrollToTop(); // ✅ Hook para resetar scroll

  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('viewer');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados para modal de criar novo usuário
  const [newUserModalVisible, setNewUserModalVisible] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    // Só carrega se o usuário estiver autenticado
    if (userId) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('[UsersScreen] Iniciando carregamento de usuários...');
      
      const resultado = await buscarUsuariosComPerfis();
      console.log('[UsersScreen] Resultado da busca:', resultado);

      if (resultado.error) {
        console.error('[UsersScreen] Erro ao buscar usuários:', resultado.error);
        if (resultado.error.message?.includes('Acesso negado') || resultado.error.message?.includes('permission denied')) {
          Alert.alert('Acesso Negado', 'Apenas administradores podem acessar esta página.');
        } else {
          // Não mostra alerta para erros comuns, apenas loga
          console.warn('[UsersScreen] Erro ao carregar usuários (não crítico):', resultado.error.message);
        }
        setUsers([]); // Limpa a lista em caso de erro
        return;
      }

      if (resultado.data) {
        console.log('[UsersScreen] Usuários carregados:', resultado.data.length);
        setUsers(resultado.data);
      } else {
        console.log('[UsersScreen] Nenhum usuário encontrado');
        setUsers([]); // Garante que a lista está vazia se não houver dados
      }
    } catch (error: any) {
      console.error('[UsersScreen] Exceção ao carregar usuários:', error);
      setUsers([]); // Limpa a lista em caso de erro
    } finally {
      // SEMPRE desliga o loading, mesmo em caso de erro
      console.log('[UsersScreen] Desligando loading...');
      setLoading(false);
    }
  };

  const openModalChangeRole = (user: UserWithProfile) => {
    // Não pode alterar o próprio perfil
    if (user.id === userId) {
      Alert.alert('Aviso', 'Você não pode alterar seu próprio perfil.');
      return;
    }

    setSelectedUser(user);
    setSelectedRole(user.role || 'viewer');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedUser(null);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.has_profile) {
        // Atualizar perfil existente
        await atualizarPerfil(selectedUser.id, selectedRole);
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      } else {
        // Criar novo perfil
        await criarPerfil(selectedUser.id, selectedRole);
        Alert.alert('Sucesso', 'Perfil criado com sucesso!');
      }

      closeModal();
      await loadUsers();
      
      // Se alterou o perfil do próprio usuário, recarrega
      if (selectedUser.id === userId) {
        await refreshUserRole();
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', error.message || 'Não foi possível salvar o perfil');
    }
  };

  const handleRemoveProfile = (user: UserWithProfile) => {
    if (user.id === userId) {
      Alert.alert('Aviso', 'Você não pode deletar sua própria conta.');
      return;
    }

    Alert.alert(
      'Confirmar exclusão permanente',
      `⚠️ ATENÇÃO: Esta ação não pode ser desfeita!\n\n` +
      `Deseja realmente deletar permanentemente o usuário "${user.email}"?\n\n` +
      `O usuário será removido completamente do sistema, incluindo:\n` +
      `• Perfil\n` +
      `• Conta de autenticação\n` +
      `• Todos os dados associados`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar Permanentemente',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarUsuarioPermanentemente(user.id);
              Alert.alert('Sucesso', 'Usuário deletado permanentemente do sistema!');
              await loadUsers();
            } catch (error: any) {
              console.error('Erro ao deletar usuário:', error);
              
              // Se o erro menciona que precisa deletar manualmente, mostra mensagem específica
              if (error.message?.includes('Execute o SQL')) {
                Alert.alert(
                  'Perfil Removido',
                  'O perfil foi removido, mas o usuário ainda existe no sistema.\n\n' +
                  'Para deletar completamente, execute este SQL no Supabase:\n\n' +
                  `DELETE FROM auth.users WHERE id = '${user.id}';`
                );
                await loadUsers();
              } else {
                Alert.alert('Erro', error.message || 'Não foi possível deletar o usuário');
              }
            }
          },
        },
      ]
    );
  };

  const openNewUserModal = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('viewer');
    setNewUserModalVisible(true);
  };

  const closeNewUserModal = () => {
    setNewUserModalVisible(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('viewer');
  };

  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleCreateUser = async () => {
    // Validações
    if (!newUserEmail.trim()) {
      Alert.alert('Erro', 'Por favor, informe o email do usuário.');
      return;
    }

    if (!validarEmail(newUserEmail.trim())) {
      Alert.alert('Erro', 'Por favor, insira um email válido.');
      return;
    }

    if (!newUserPassword || newUserPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCreatingUser(true);

    try {
      console.log('[UsersScreen] Criando usuário com role:', newUserRole);
      console.log('[UsersScreen] Email:', newUserEmail.trim());
      console.log('[UsersScreen] Nome:', newUserName.trim() || undefined);
      
      const resultado = await criarNovoUsuario(
        newUserEmail.trim(),
        newUserPassword,
        newUserRole,
        newUserName.trim() || undefined
      );
      
      console.log('[UsersScreen] Resultado da criação:', resultado);

      // Fecha o modal primeiro
      closeNewUserModal();
      
      // Garante que o loading seja desligado imediatamente
      setLoading(false);
      setCreatingUser(false);

      // Verifica se o email foi confirmado
      const emailConfirmado = resultado?.data?.emailConfirmado;
      
      console.log('[UsersScreen] Email confirmado:', emailConfirmado);
      
      // Aguarda um pouco para garantir que o modal foi fechado antes de mostrar o Alert
      setTimeout(() => {
        if (emailConfirmado === false) {
          // Email não foi confirmado automaticamente, mas usuário foi criado
          Alert.alert(
            'Usuário Criado com Sucesso!',
            'Usuário criado com sucesso!\n\n' +
            '⚠️ O email não foi confirmado automaticamente.\n\n' +
            'SOLUÇÃO RÁPIDA:\n' +
            '1. Acesse Supabase Dashboard\n' +
            '2. Authentication → Providers → Email\n' +
            '3. Desabilite "Confirm email"\n\n' +
            'OU execute este SQL:\n' +
            `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '${newUserEmail.trim()}';`,
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[UsersScreen] Navegando para página inicial...');
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        } else {
          // Tudo certo, email confirmado
          Alert.alert(
            'Usuário Criado com Sucesso!',
            'Usuário criado com sucesso! O usuário já pode fazer login.',
            [
              {
                text: 'OK',
                onPress: () => {
                  console.log('[UsersScreen] Navegando para página inicial...');
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        }
      }, 300);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      // Garante que o loading seja desligado mesmo em caso de erro
      setLoading(false);
      setCreatingUser(false);
      
      // Mostra erro após um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        Alert.alert('Erro', error.message || 'Não foi possível criar o usuário');
      }, 100);
    }
  };

  // Filtros
  const filteredUsers = users.filter((user) => {
    // Filtro por role
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'no_profile' && !user.has_profile) ||
      (filterRole !== 'no_profile' && user.role === filterRole);

    // Filtro por busca
    const matchesSearch =
      searchQuery.trim() === '' ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  return (
    <ProtectedRoute requiredRole="admin">
      <View style={styles.container}>
        <AnimatedBackground />
        {loading ? (
          <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
            <ActivityIndicator size="large" color="#00b09b" />
            <ThemedText style={styles.loadingText}>Carregando usuários...</ThemedText>
          </View>
        ) : (
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
            showsVerticalScrollIndicator={false}>
            <ScreenHeader
              title="Gerenciar
              Usuários"
              subtitle={`${users.length} usuário${users.length !== 1 ? 's' : ''} cadastrado${users.length !== 1 ? 's' : ''}`}
              rightAction={{
                icon: 'add',
                onPress: openNewUserModal,
                visible: isAdmin,
              }}
              showCompanySelector={true}
            />

            {/* Search Bar */}
            <GlassContainer style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <IconSymbol name="magnifyingglass" size={20} color="rgba(255, 255, 255, 0.6)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por email..."
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

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filters}>
              <TouchableOpacity
                style={[styles.filterButton, filterRole === 'all' && styles.filterButtonActive]}
                onPress={() => setFilterRole('all')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterRole === 'all' ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  Todos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterRole === 'admin' && styles.filterButtonActive]}
                onPress={() => setFilterRole('admin')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterRole === 'admin' ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  Admin
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterRole === 'analista' && styles.filterButtonActive]}
                onPress={() => setFilterRole('analista')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterRole === 'analista' ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  Analista
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterRole === 'viewer' && styles.filterButtonActive]}
                onPress={() => setFilterRole('viewer')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterRole === 'viewer' ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  Viewer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterRole === 'no_profile' && styles.filterButtonActive]}
                onPress={() => setFilterRole('no_profile')}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterText,
                    filterRole === 'no_profile' ? styles.filterTextActive : styles.filterTextInactive,
                  ]}>
                  Sem Perfil
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <GlassContainer style={styles.emptyState}>
                <IconSymbol name="person.2" size={48} color="rgba(255, 255, 255, 0.5)" />
                <ThemedText style={styles.emptyStateText}>Nenhum usuário encontrado</ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  {searchQuery ? 'Tente buscar com outros termos' : 'Não há usuários cadastrados'}
                </ThemedText>
              </GlassContainer>
            ) : (
              <View style={styles.usersList}>
                {filteredUsers.map((user) => {
                  const isCurrentUser = user.id === userId;

                  return (
                    <GlassContainer key={user.id} style={styles.userCard}>
                      <View style={styles.userHeader}>
                        <View style={styles.userIcon}>
                          <IconSymbol name="person.crop.circle.fill" size={32} color="#00b09b" />
                        </View>
                        <View style={styles.userInfo}>
                          <View style={styles.userNameRow}>
                            <ThemedText type="defaultSemiBold" style={styles.userName}>
                              {user.email}
                            </ThemedText>
                            {isCurrentUser && (
                              <View style={styles.youBadge}>
                                <Text style={styles.youBadgeText}>Você</Text>
                              </View>
                            )}
                          </View>
                          <ThemedText style={styles.userDate}>
                            Cadastrado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </ThemedText>
                        </View>
                      </View>

                      <View style={styles.roleRow}>
                        <View
                          style={[
                            styles.roleBadge,
                            { backgroundColor: `${getRoleColor(user.role || null)}20` },
                          ]}>
                          <Text style={[styles.roleText, { color: getRoleColor(user.role || null) }]}>
                            {user.has_profile ? getRoleName(user.role!) : 'Sem Perfil'}
                          </Text>
                        </View>
                      </View>

                      {!isCurrentUser && (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            onPress={() => openModalChangeRole(user)}
                            style={styles.actionButton}
                            activeOpacity={0.7}>
                            <IconSymbol name="pencil" size={16} color="#00b09b" />
                            <Text style={styles.actionButtonText}>
                              {user.has_profile ? 'Alterar Perfil' : 'Atribuir Perfil'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemoveProfile(user)}
                            style={[styles.actionButton, styles.actionButtonDanger]}
                            activeOpacity={0.7}>
                            <IconSymbol name="trash" size={16} color="#EF4444" />
                            <Text style={styles.actionButtonTextDanger}>Deletar Usuário</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </GlassContainer>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Modal de Alterar Perfil */}
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
                    {selectedUser?.has_profile ? 'Alterar Perfil' : 'Atribuir Perfil'}
                  </ThemedText>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.userEmailCard}>
                    <ThemedText style={styles.userEmailLabel}>Usuário:</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.userEmailValue}>
                      {selectedUser?.email}
                    </ThemedText>
                  </View>

                  <ThemedText style={styles.sectionTitle}>Selecione o Perfil:</ThemedText>

                  {/* Admin */}
                  <TouchableOpacity
                    style={[styles.roleOption, selectedRole === 'admin' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('admin')}
                    activeOpacity={0.7}>
                    <View style={styles.roleOptionHeader}>
                      <View
                        style={[
                          styles.roleOptionIcon,
                          selectedRole === 'admin' && styles.roleOptionIconActive,
                        ]}>
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color={selectedRole === 'admin' ? '#FFFFFF' : 'transparent'}
                        />
                      </View>
                      <View style={styles.roleOptionContent}>
                        <View
                          style={[
                            styles.roleOptionBadge,
                            { backgroundColor: `${getRoleColor('admin')}20` },
                          ]}>
                          <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('admin') }]}>
                            {getRoleName('admin')}
                          </Text>
                        </View>
                        <ThemedText style={styles.roleOptionDescription}>
                          {getRoleDescription('admin')}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Analista */}
                  <TouchableOpacity
                    style={[styles.roleOption, selectedRole === 'analista' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('analista')}
                    activeOpacity={0.7}>
                    <View style={styles.roleOptionHeader}>
                      <View
                        style={[
                          styles.roleOptionIcon,
                          selectedRole === 'analista' && styles.roleOptionIconActive,
                        ]}>
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color={selectedRole === 'analista' ? '#FFFFFF' : 'transparent'}
                        />
                      </View>
                      <View style={styles.roleOptionContent}>
                        <View
                          style={[
                            styles.roleOptionBadge,
                            { backgroundColor: `${getRoleColor('analista')}20` },
                          ]}>
                          <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('analista') }]}>
                            {getRoleName('analista')}
                          </Text>
                        </View>
                        <ThemedText style={styles.roleOptionDescription}>
                          {getRoleDescription('analista')}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Viewer */}
                  <TouchableOpacity
                    style={[styles.roleOption, selectedRole === 'viewer' && styles.roleOptionActive]}
                    onPress={() => setSelectedRole('viewer')}
                    activeOpacity={0.7}>
                    <View style={styles.roleOptionHeader}>
                      <View
                        style={[
                          styles.roleOptionIcon,
                          selectedRole === 'viewer' && styles.roleOptionIconActive,
                        ]}>
                        <IconSymbol
                          name="checkmark"
                          size={20}
                          color={selectedRole === 'viewer' ? '#FFFFFF' : 'transparent'}
                        />
                      </View>
                      <View style={styles.roleOptionContent}>
                        <View
                          style={[
                            styles.roleOptionBadge,
                            { backgroundColor: `${getRoleColor('viewer')}20` },
                          ]}>
                          <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('viewer') }]}>
                            {getRoleName('viewer')}
                          </Text>
                        </View>
                        <ThemedText style={styles.roleOptionDescription}>
                          {getRoleDescription('viewer')}
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.modalActions}>
                    <Button
                      title="Salvar"
                      onPress={handleSaveRole}
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

        {/* Modal de Criar Novo Usuário */}
        <Modal
          visible={newUserModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeNewUserModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
              <AnimatedBackground />
              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeader}>
                  <ThemedText type="title" style={styles.modalTitle}>
                    Criar Novo Usuário
                  </ThemedText>
                  <TouchableOpacity onPress={closeNewUserModal} style={styles.closeButton}>
                    <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.formContainer}>
                  {/* Nome (opcional) */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Nome (opcional)</ThemedText>
                    <GlassContainer style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Nome do usuário"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={newUserName}
                        onChangeText={setNewUserName}
                        autoCapitalize="words"
                      />
                    </GlassContainer>
                  </View>

                  {/* Email */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Email *</ThemedText>
                    <GlassContainer style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="usuario@exemplo.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={newUserEmail}
                        onChangeText={setNewUserEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </GlassContainer>
                  </View>

                  {/* Senha */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.inputLabel}>Senha Temporária *</ThemedText>
                    <GlassContainer style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Mínimo 6 caracteres"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={newUserPassword}
                        onChangeText={setNewUserPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </GlassContainer>
                    <ThemedText style={styles.inputHint}>
                      O usuário poderá alterar esta senha após o primeiro login
                    </ThemedText>
                  </View>

                  {/* Perfil */}
                  <View style={styles.inputGroup}>
                    <ThemedText style={styles.sectionTitle}>Selecione o Perfil:</ThemedText>

                    {/* Admin */}
                    <TouchableOpacity
                      style={[styles.roleOption, newUserRole === 'admin' && styles.roleOptionActive]}
                      onPress={() => setNewUserRole('admin')}
                      activeOpacity={0.7}>
                      <View style={styles.roleOptionHeader}>
                        <View
                          style={[
                            styles.roleOptionIcon,
                            newUserRole === 'admin' && styles.roleOptionIconActive,
                          ]}>
                          <IconSymbol
                            name="checkmark"
                            size={20}
                            color={newUserRole === 'admin' ? '#FFFFFF' : 'transparent'}
                          />
                        </View>
                        <View style={styles.roleOptionContent}>
                          <View
                            style={[
                              styles.roleOptionBadge,
                              { backgroundColor: `${getRoleColor('admin')}20` },
                            ]}>
                            <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('admin') }]}>
                              {getRoleName('admin')}
                            </Text>
                          </View>
                          <ThemedText style={styles.roleOptionDescription}>
                            {getRoleDescription('admin')}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Analista */}
                    <TouchableOpacity
                      style={[styles.roleOption, newUserRole === 'analista' && styles.roleOptionActive]}
                      onPress={() => setNewUserRole('analista')}
                      activeOpacity={0.7}>
                      <View style={styles.roleOptionHeader}>
                        <View
                          style={[
                            styles.roleOptionIcon,
                            newUserRole === 'analista' && styles.roleOptionIconActive,
                          ]}>
                          <IconSymbol
                            name="checkmark"
                            size={20}
                            color={newUserRole === 'analista' ? '#FFFFFF' : 'transparent'}
                          />
                        </View>
                        <View style={styles.roleOptionContent}>
                          <View
                            style={[
                              styles.roleOptionBadge,
                              { backgroundColor: `${getRoleColor('analista')}20` },
                            ]}>
                            <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('analista') }]}>
                              {getRoleName('analista')}
                            </Text>
                          </View>
                          <ThemedText style={styles.roleOptionDescription}>
                            {getRoleDescription('analista')}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Viewer */}
                    <TouchableOpacity
                      style={[styles.roleOption, newUserRole === 'viewer' && styles.roleOptionActive]}
                      onPress={() => setNewUserRole('viewer')}
                      activeOpacity={0.7}>
                      <View style={styles.roleOptionHeader}>
                        <View
                          style={[
                            styles.roleOptionIcon,
                            newUserRole === 'viewer' && styles.roleOptionIconActive,
                          ]}>
                          <IconSymbol
                            name="checkmark"
                            size={20}
                            color={newUserRole === 'viewer' ? '#FFFFFF' : 'transparent'}
                          />
                        </View>
                        <View style={styles.roleOptionContent}>
                          <View
                            style={[
                              styles.roleOptionBadge,
                              { backgroundColor: `${getRoleColor('viewer')}20` },
                            ]}>
                            <Text style={[styles.roleOptionBadgeText, { color: getRoleColor('viewer') }]}>
                              {getRoleName('viewer')}
                            </Text>
                          </View>
                          <ThemedText style={styles.roleOptionDescription}>
                            {getRoleDescription('viewer')}
                          </ThemedText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      title={creatingUser ? 'Criando...' : 'Criar Usuário'}
                      onPress={handleCreateUser}
                      style={styles.saveButton}
                      disabled={creatingUser}
                    />
                    <Button
                      title="Cancelar"
                      onPress={closeNewUserModal}
                      variant="outline"
                      style={styles.cancelButton}
                      disabled={creatingUser}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ProtectedRoute>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  addButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchContainer: {
    marginBottom: 16,
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
  filtersScroll: {
    marginBottom: 20,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
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
  usersList: {
    gap: 16,
    marginBottom: 16,
  },
  userCard: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  youBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  youBadgeText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
  },
  userDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  roleRow: {
    marginBottom: 12,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
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
    gap: 16,
  },
  userEmailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  userEmailLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  userEmailValue: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roleOptionActive: {
    borderColor: '#00b09b',
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
  },
  roleOptionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  roleOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionIconActive: {
    borderColor: '#00b09b',
    backgroundColor: '#00b09b',
  },
  roleOptionContent: {
    flex: 1,
  },
  roleOptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleOptionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleOptionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputContainer: {
    padding: 12,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 8,
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
});
