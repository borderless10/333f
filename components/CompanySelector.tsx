import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCompany } from '@/contexts/CompanyContext';
import { type Company } from '@/lib/services/companies';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function CompanySelector() {
  const insets = useSafeAreaInsets();
  const { selectedCompany, companies, setSelectedCompany, loading } = useCompany();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));

  // Filtra empresas baseado na busca
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) {
      return companies;
    }

    const query = searchQuery.toLowerCase().trim();
    return companies.filter(
      (company) =>
        company.razao_social.toLowerCase().includes(query) ||
        company.nome_fantasia?.toLowerCase().includes(query) ||
        company.cnpj.replace(/[^\d]/g, '').includes(query)
    );
  }, [companies, searchQuery]);

  // Anima abertura do modal
  const openModal = () => {
    setModalVisible(true);
    setSearchQuery('');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Fecha o modal
  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSearchQuery('');
    });
  };

  // Seleciona uma empresa
  const handleSelectCompany = async (company: Company) => {
    await setSelectedCompany(company);
    closeModal();
  };

  // Limpa seleção
  const handleClearSelection = async () => {
    await setSelectedCompany(null);
    closeModal();
  };

  const displayName = selectedCompany?.nome_fantasia || selectedCompany?.razao_social || 'Selecionar Empresa';

  return (
    <>
      {/* Botão do Seletor */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={openModal}
        activeOpacity={0.7}>
        <View style={styles.selectorContent}>
          <MaterialIcons name="business" size={18} color="#00b09b" />
          <View style={styles.selectorTextContainer}>
            <ThemedText style={styles.selectorLabel} numberOfLines={1}>Empresa</ThemedText>
            <ThemedText style={styles.selectorName} numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </ThemedText>
          </View>
          <IconSymbol name="chevron.down" size={14} color="rgba(255, 255, 255, 0.6)" />
        </View>
      </TouchableOpacity>

      {/* Modal de Seleção */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}>
        <View style={[styles.modalOverlay, { paddingTop: insets.top }]}>
          <AnimatedBackground />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <MaterialIcons name="business" size={24} color="#00b09b" />
                <ThemedText type="title" style={styles.modalTitle}>
                  Selecionar Empresa
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
                activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={28} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            </View>

            {/* Campo de Busca */}
            <GlassContainer style={styles.searchContainer}>
              <IconSymbol name="magnifyingglass" size={20} color="rgba(255, 255, 255, 0.6)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar empresa..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  activeOpacity={0.7}>
                  <IconSymbol name="xmark.circle.fill" size={18} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
              )}
            </GlassContainer>

            {/* Lista de Empresas */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ThemedText style={styles.loadingText}>Carregando empresas...</ThemedText>
              </View>
            ) : filteredCompanies.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="business-center" size={48} color="rgba(255, 255, 255, 0.3)" />
                <ThemedText style={styles.emptyText}>
                  {searchQuery.trim()
                    ? 'Nenhuma empresa encontrada'
                    : 'Nenhuma empresa cadastrada'}
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filteredCompanies}
                keyExtractor={(item) => item.id?.toString() || ''}
                renderItem={({ item }) => (
                  <CompanyItem
                    company={item}
                    isSelected={selectedCompany?.id === item.id}
                    onSelect={() => handleSelectCompany(item)}
                  />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* Opção para limpar seleção */}
            {selectedCompany && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearSelection}
                activeOpacity={0.7}>
                <IconSymbol name="xmark.circle" size={20} color="rgba(255, 255, 255, 0.6)" />
                <ThemedText style={styles.clearButtonText}>Limpar Seleção</ThemedText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

// Componente de Item da Empresa
function CompanyItem({
  company,
  isSelected,
  onSelect,
}: {
  company: Company;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const displayName = company.nome_fantasia || company.razao_social;

  return (
    <TouchableOpacity
      style={[styles.companyItem, isSelected && styles.companyItemSelected]}
      onPress={onSelect}
      activeOpacity={0.7}>
      <GlassContainer style={styles.companyCard}>
        <View style={styles.companyContent}>
          <View style={styles.companyInfo}>
            <View style={styles.companyHeader}>
              <ThemedText style={styles.companyName} numberOfLines={1}>
                {displayName}
              </ThemedText>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#00b09b" />
                </View>
              )}
            </View>
            {company.razao_social !== displayName && (
              <ThemedText style={styles.companyRazao} numberOfLines={1}>
                {company.razao_social}
              </ThemedText>
            )}
            <View style={styles.companyDetails}>
              <View style={styles.companyDetailItem}>
                <MaterialIcons name="badge" size={14} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.companyDetailText}>
                  {company.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}
                </Text>
              </View>
              {company.cidade && company.estado && (
                <View style={styles.companyDetailItem}>
                  <MaterialIcons name="location-on" size={14} color="rgba(255, 255, 255, 0.5)" />
                  <Text style={styles.companyDetailText}>
                    {company.cidade}, {company.estado}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </GlassContainer>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    marginRight: 0,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 155, 0.3)',
    minWidth: 90,
    maxWidth: 140,
  },
  selectorTextContainer: {
    flex: 1,
    marginLeft: 2,
    minWidth: 0, // Permite truncamento
    maxWidth: 100,
  },
  selectorLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 0,
    lineHeight: 11,
  },
  selectorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  companyItem: {
    marginBottom: 12,
  },
  companyItemSelected: {
    opacity: 1,
  },
  companyCard: {
    padding: 16,
  },
  companyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyInfo: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  selectedBadge: {
    marginLeft: 8,
  },
  companyRazao: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  companyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  companyDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  companyDetailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
    textAlign: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  clearButtonText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
