/**
 * Modal profissional para associar usuários a empresas
 * Design minimalista com seleção múltipla e feedback visual
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import type { UserWithProfile } from '@/lib/services/profiles';
import type { Company } from '@/lib/services/companies';
import {
  buscarAssociacoesUsuario,
  sincronizarAssociacoesUsuario,
  type UserEmpresaAssociation,
} from '@/lib/services/user-empresas';
import { buscarEmpresas } from '@/lib/services/companies';

interface UserCompanyModalProps {
  visible: boolean;
  user: UserWithProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserCompanyModal({
  visible,
  user,
  onClose,
  onSuccess,
}: UserCompanyModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<number>>(new Set());
  const [initialCompanyIds, setInitialCompanyIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Carregar dados quando modal abre
  useEffect(() => {
    if (visible && user && userId) {
      loadData();
    } else {
      // Resetar ao fechar
      setSelectedCompanyIds(new Set());
      setInitialCompanyIds(new Set());
      setSearchQuery('');
    }
  }, [visible, user, userId]);

  const loadData = async () => {
    if (!user || !userId) return;

    try {
      setLoading(true);

      // Carregar empresas disponíveis e associações atuais em paralelo
      const [empresasResult, associacoes] = await Promise.all([
        buscarEmpresas(userId, { ativa: true }),
        buscarAssociacoesUsuario(user.id),
      ]);

      if (empresasResult.error) {
        throw empresasResult.error;
      }

      setCompanies(empresasResult.data || []);

      // Marcar empresas já associadas
      const empresasAssociadas = new Set(
        associacoes.filter(a => a.ativo).map(a => a.empresa_id)
      );
      setSelectedCompanyIds(empresasAssociadas);
      setInitialCompanyIds(empresasAssociadas);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showError('Não foi possível carregar as empresas');
    } finally {
      setLoading(false);
    }
  };

  const toggleCompany = useCallback((companyId: number) => {
    setSelectedCompanyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(companyId)) {
        newSet.delete(companyId);
      } else {
        newSet.add(companyId);
      }
      return newSet;
    });
  }, []);

  const handleSave = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const result = await sincronizarAssociacoesUsuario(
        user.id,
        Array.from(selectedCompanyIds),
        user.role || 'viewer' // Usa o role global do usuário como padrão
      );

      // Feedback detalhado
      const { added, removed, kept } = result;
      const total = selectedCompanyIds.size;

      if (added > 0 || removed > 0) {
        let message = '';
        if (added > 0) message += `${added} empresa${added > 1 ? 's' : ''} adicionada${added > 1 ? 's' : ''}`;
        if (added > 0 && removed > 0) message += ' • ';
        if (removed > 0) message += `${removed} removida${removed > 1 ? 's' : ''}`;

        showSuccess(message, {
          title: `${total} empresa${total !== 1 ? 's' : ''} vinculada${total !== 1 ? 's' : ''}`,
          iconType: 'link',
          duration: 4000,
        });
      } else if (kept > 0) {
        showInfo(`Nenhuma alteração necessária`, {
          title: 'Empresas já vinculadas',
          iconType: 'link',
        });
      }

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar associações:', error);
      showError(error.message || 'Não foi possível salvar as associações');
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.razao_social.toLowerCase().includes(query) ||
      company.nome_fantasia?.toLowerCase().includes(query) ||
      company.cnpj.includes(query.replace(/\D/g, ''))
    );
  });

  const hasChanges = () => {
    if (selectedCompanyIds.size !== initialCompanyIds.size) return true;
    for (const id of selectedCompanyIds) {
      if (!initialCompanyIds.has(id)) return true;
    }
    return false;
  };

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20 }]}>
          <AnimatedBackground />

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol name="building.2.fill" size={28} color="#00b09b" />
              </View>
              <View style={styles.headerText}>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Empresas do Usuário
                </ThemedText>
                <ThemedText style={styles.modalSubtitle}>
                  {user.email}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Info Box */}
          <GlassContainer style={styles.infoBox}>
            <IconSymbol name="info.circle.fill" size={20} color="#6366F1" />
            <ThemedText style={styles.infoText}>
              Selecione quais empresas este usuário pode acessar. O nível de permissão será
              determinado pelo perfil do usuário.
            </ThemedText>
          </GlassContainer>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <IconSymbol name="magnifyingglass" size={18} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar empresa..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <IconSymbol name="xmark.circle.fill" size={18} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Companies List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00b09b" />
              <ThemedText style={styles.loadingText}>Carregando empresas...</ThemedText>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              {filteredCompanies.length === 0 ? (
                <GlassContainer style={styles.emptyState}>
                  <IconSymbol name="building.2" size={48} color="rgba(255, 255, 255, 0.5)" />
                  <ThemedText style={styles.emptyStateText}>
                    {searchQuery ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                  </ThemedText>
                  <ThemedText style={styles.emptyStateSubtext}>
                    {searchQuery
                      ? 'Tente outro termo de busca'
                      : 'Cadastre empresas primeiro'}
                  </ThemedText>
                </GlassContainer>
              ) : (
                <View style={styles.companiesList}>
                  <ThemedText style={styles.countText}>
                    {selectedCompanyIds.size} de {companies.length} empresa
                    {companies.length !== 1 ? 's' : ''} selecionada
                    {selectedCompanyIds.size !== 1 ? 's' : ''}
                  </ThemedText>

                  {filteredCompanies.map(company => {
                    const isSelected = selectedCompanyIds.has(company.id!);
                    const wasInitiallySelected = initialCompanyIds.has(company.id!);

                    return (
                      <TouchableOpacity
                        key={company.id}
                        onPress={() => toggleCompany(company.id!)}
                        activeOpacity={0.7}
                        style={[
                          styles.companyItem,
                          isSelected && styles.companyItemSelected,
                        ]}>
                        <View style={styles.companyItemLeft}>
                          {/* Checkbox customizado */}
                          <View
                            style={[
                              styles.checkbox,
                              isSelected && styles.checkboxSelected,
                            ]}>
                            {isSelected && (
                              <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                            )}
                          </View>

                          <View style={styles.companyItemInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.companyName}>
                              {company.nome_fantasia || company.razao_social}
                            </ThemedText>
                            <ThemedText style={styles.companyDetails}>
                              {company.razao_social}
                            </ThemedText>
                            <ThemedText style={styles.companyCNPJ}>
                              CNPJ: {company.cnpj.replace(
                                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                                '$1.$2.$3/$4-$5'
                              )}
                            </ThemedText>
                          </View>
                        </View>

                        {/* Badge de status */}
                        {wasInitiallySelected && !isSelected && (
                          <View style={styles.removedBadge}>
                            <IconSymbol name="minus.circle.fill" size={16} color="#EF4444" />
                          </View>
                        )}
                        {!wasInitiallySelected && isSelected && (
                          <View style={styles.addedBadge}>
                            <IconSymbol name="plus.circle.fill" size={16} color="#10B981" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {/* Actions */}
          <View style={styles.modalActions}>
            <Button
              title={saving ? 'Salvando...' : 'Salvar Associações'}
              onPress={handleSave}
              disabled={loading || saving || !hasChanges()}
              style={[styles.saveButton, !hasChanges() && styles.saveButtonDisabled]}
            />
            <Button
              title="Cancelar"
              onPress={onClose}
              disabled={loading || saving}
              variant="outline"
              style={styles.cancelButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  modalSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  companiesList: {
    gap: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  companyItemSelected: {
    backgroundColor: 'rgba(0, 176, 155, 0.12)',
    borderColor: '#00b09b',
  },
  companyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#00b09b',
    borderColor: '#00b09b',
  },
  companyItemInfo: {
    flex: 1,
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  companyDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  companyCNPJ: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  addedBadge: {
    padding: 4,
  },
  removedBadge: {
    padding: 4,
  },
  modalActions: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#00b09b',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(0, 176, 155, 0.5)',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});
