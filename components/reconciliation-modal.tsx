import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import { buscarContas, type ContaBancaria } from '@/lib/contas';
import * as Haptics from 'expo-haptics';
import {
  createReconciliation,
  generateMatchSuggestions,
  getUnreconciledTitles,
  getUnreconciledTransactions,
  type MatchSuggestion,
} from '@/lib/services/reconciliation';
import type { TitleWithAccount } from '@/lib/services/titles';
import type { TransactionWithAccount } from '@/lib/services/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBackground } from './animated-background';
import { GlassContainer } from './glass-container';
import { SobrasFaltasListView } from './sobras-faltas-list-view';
import { SobrasFaltasSection, type SobrasFaltasSummary } from './sobras-faltas-section';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import Toast from 'react-native-toast-message';
import { toastConfig } from './NotificationToast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 10;
const COLUMN_PADDING = 10;
const CARD_MIN_WIDTH = 120;

interface ReconciliationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReconciliationModal({ visible, onClose, onSuccess }: ReconciliationModalProps) {
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();

  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([]);
  const [titles, setTitles] = useState<TitleWithAccount[]>([]);
  const [suggestions, setSuggestions] = useState<MatchSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<number | null>(null);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [filterAccount, setFilterAccount] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [matchWasRunWithZeroSuggestions, setMatchWasRunWithZeroSuggestions] = useState(false);
  const [listViewMode, setListViewMode] = useState<'sobras' | 'faltas' | null>(null);
  const [sobrasFaltasActiveTab, setSobrasFaltasActiveTab] = useState<'sobras' | 'faltas' | null>(null);

  // Animações
  const leftColumnAnim = useRef(new Animated.Value(0)).current;
  const rightColumnAnim = useRef(new Animated.Value(0)).current;
  const suggestionAnim = useRef(new Animated.Value(0)).current;
  const sobrasFaltasAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && userId) {
      // Resetar estados ao abrir
      setIsInitialized(false);
      setSuggestions([]);
      setSelectedTransaction(null);
      setSelectedTitle(null);
      setFilterAccount(null);
      loadData().then(() => {
        setIsInitialized(true);
      });
    } else {
      // Resetar estados ao fechar
      setIsInitialized(false);
      setTransactions([]);
      setTitles([]);
      setSuggestions([]);
      setSelectedTransaction(null);
      setSelectedTitle(null);
      setFilterAccount(null);
      setLoading(false);
      setMatching(false);
      setMatchWasRunWithZeroSuggestions(false);
      setListViewMode(null);
      setSobrasFaltasActiveTab(null);
    }
  }, [visible, userId]);

  useEffect(() => {
    if (visible && userId && isInitialized && filterAccount !== null) {
      loadData();
    }
  }, [filterAccount]);

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Parar animação anterior SEM callbacks
    const stopPreviousAnimation = () => {
      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    };

    // Resetar valores diretamente SEM callbacks
    const resetValues = () => {
      try {
        if (isMountedRef.current) {
          leftColumnAnim.setValue(0);
          rightColumnAnim.setValue(0);
          suggestionAnim.setValue(0);
          sobrasFaltasAnim.setValue(0);
        }
      } catch (error) {
        // Ignorar erros de imutabilidade
      }
    };

    if (visible) {
      stopPreviousAnimation();
      resetValues();
      sobrasFaltasAnim.setValue(0);

      // Usar requestAnimationFrame para garantir estabilidade
      const rafId = requestAnimationFrame(() => {
        const timeoutId = setTimeout(() => {
          if (!isMountedRef.current) return;

          try {
            animationRef.current = Animated.parallel([
              Animated.timing(leftColumnAnim, {
                toValue: 1,
                duration: 400,
                delay: 100,
                useNativeDriver: true,
              }),
              Animated.timing(rightColumnAnim, {
                toValue: 1,
                duration: 400,
                delay: 150,
                useNativeDriver: true,
              }),
              Animated.timing(sobrasFaltasAnim, {
                toValue: 1,
                duration: 350,
                delay: 50,
                useNativeDriver: true,
              }),
            ]);

            animationRef.current.start();
          } catch (error) {
            // Ignorar erros silenciosamente
          }
        }, Platform.OS === 'android' ? 100 : 50);

        return () => {
          clearTimeout(timeoutId);
        };
      });

      return () => {
        cancelAnimationFrame(rafId);
      };
    } else {
      stopPreviousAnimation();
      resetValues();
    }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros durante cleanup
      }
    };
  }, [visible, leftColumnAnim, rightColumnAnim, suggestionAnim, sobrasFaltasAnim]);

  const loadData = async () => {
    if (!userId || !visible) return;

    try {
      setLoading(true);
      const [txData, titlesData, contasData] = await Promise.all([
        getUnreconciledTransactions(userId).catch((err) => {
          console.error('Erro ao buscar transações:', err);
          return [];
        }),
        getUnreconciledTitles(userId).catch((err) => {
          console.error('Erro ao buscar títulos:', err);
          return [];
        }),
        buscarContas(userId).catch((err) => {
          console.error('Erro ao buscar contas:', err);
          return [];
        }),
      ]);

      let filteredTx = txData || [];
      let filteredTitles = titlesData || [];

      if (filterAccount) {
        filteredTx = filteredTx.filter((t) => t.conta_bancaria_id === filterAccount);
        filteredTitles = filteredTitles.filter((t) => t.conta_bancaria_id === filterAccount);
      }

      setTransactions(filteredTx);
      setTitles(filteredTitles);
      setContas(contasData || []);
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      showError('Não foi possível carregar os dados');
      setTransactions([]);
      setTitles([]);
      setContas([]);
    } finally {
      setLoading(false);
    }
  };

  const generateAutoMatches = async () => {
    if (!userId || matching) return; // Prevenir múltiplas chamadas

    try {
      setMatching(true);
      const matches = await generateMatchSuggestions(userId, undefined, filterAccount);
      
      if (visible) {
        const suggestionsList = matches || [];
        setSuggestions(suggestionsList);
        setMatchWasRunWithZeroSuggestions(suggestionsList.length === 0);

        // Notificação quando match automático encontra sugestões
        if (suggestionsList.length > 0) {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          showInfo(
            `${suggestionsList.length} ${suggestionsList.length === 1 ? 'sugestão encontrada' : 'sugestões encontradas'}!`,
            {
              iconType: 'auto_match',
              title: 'Match automático',
              duration: 4000,
            }
          );
        }

        // Resetar e animar SEM callbacks
        try {
          suggestionAnim.setValue(0);
          const anim = Animated.spring(suggestionAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          });
          anim.start();
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      }
    } catch (error: any) {
      console.error('Erro ao gerar matches:', error);
      if (visible) {
        showError('Erro ao gerar sugestões de matching');
      }
    } finally {
      if (visible) {
        setMatching(false);
      }
    }
  };

  const handleSelectTransaction = (id: number) => {
    setSelectedTransaction(selectedTransaction === id ? null : id);
    setSelectedTitle(null);
  };

  const handleSelectTitle = (id: number) => {
    setSelectedTitle(selectedTitle === id ? null : id);
  };

  const handleReconcile = async (transacaoId: number, tituloId: number, isAutoMatch: boolean = false) => {
    if (!userId || !visible) return;

    try {
      await createReconciliation(userId, transacaoId, tituloId);
      if (visible) {
        // Buscar detalhes da transação e título para mensagem mais informativa
        const transaction = transactions.find(t => t.id === transacaoId);
        const title = titles.find(t => t.id === tituloId);
        
        const transactionDesc = transaction?.descricao || 'Transação';
        const titleDesc = title?.fornecedor_cliente || 'Título';

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        showSuccess(`${transactionDesc} ↔ ${titleDesc}`, {
          iconType: isAutoMatch ? 'auto_match' : 'reconciliation',
          title: 'Conciliação concluída',
          duration: 4000,
        });
        
        setSelectedTransaction(null);
        setSelectedTitle(null);
        await loadData();
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Erro ao conciliar:', error);
      if (visible) {
        showError(error.message || 'Não foi possível realizar a conciliação');
      }
    }
  };

  const handleAcceptSuggestion = async (suggestion: MatchSuggestion) => {
    if (!userId || !visible) return;

    const diffText =
      suggestion.diferenca_valor > 0 || suggestion.diferenca_dias > 0
        ? `\n⚠️ Diferença: ${formatCurrency(suggestion.diferenca_valor)} | ${suggestion.diferenca_dias} dia(s)`
        : '\n✅ Match perfeito';

    Alert.alert(
      'Confirmar Conciliação',
      `Conciliar transação "${suggestion.transaction.descricao}" com título "${suggestion.title.fornecedor_cliente}"?${diffText}`,
      [
        { 
          text: 'Cancelar', 
          style: 'cancel',
          onPress: () => {
            // Não fazer nada
          }
        },
        {
          text: 'Conciliar',
          onPress: async () => {
            if (visible) {
              await handleReconcile(suggestion.transaction.id!, suggestion.title.id!, true); // true = match automático
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString?.trim()) return '—';
    try {
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '—';
    }
  };

  const getMatchTypeColor = (matchType: MatchSuggestion['matchType']) => {
    switch (matchType) {
      case 'perfect':
        return '#10B981';
      case 'value_match':
        return '#3B82F6';
      case 'date_match':
        return '#F59E0B';
      default:
        return '#6366F1';
    }
  };

  const visibleSuggestions = useMemo(() => {
    const txIds = new Set(transactions.map((t) => t.id));
    const titleIds = new Set(titles.map((t) => t.id));
    return suggestions.filter(
      (s) => txIds.has(s.transaction.id) && titleIds.has(s.title.id)
    );
  }, [suggestions, transactions, titles]);

  // Cálculo de totais para Sobras e Faltas
  const sobrasFaltasSummary = useMemo(() => {
    const totalSobras = transactions.reduce((acc, t) => {
      const valor = t.tipo === 'receita' ? t.valor : -t.valor;
      return acc + valor;
    }, 0);
    const totalFaltas = titles.reduce((acc, t) => {
      const valor = t.tipo === 'receber' ? t.valor : -t.valor;
      return acc + valor;
    }, 0);
    return {
      sobras: { count: transactions.length, total: totalSobras, items: transactions },
      faltas: { count: titles.length, total: totalFaltas, items: titles },
    };
  }, [transactions, titles]);

  // Estabilizar estilo de sugestão para Android
  const suggestionStyle = useMemo(() => ({
    opacity: suggestionAnim,
    transform: [
      {
        translateY: suggestionAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  }), [suggestionAnim]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          <AnimatedBackground />
          <View style={styles.modalHeader}>
            {listViewMode ? (
              <>
                <TouchableOpacity
                  onPress={() => setListViewMode(null)}
                  style={styles.backButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <ThemedText type="title" style={[styles.modalTitle, styles.modalTitleWithBack]}>
                  {listViewMode === 'sobras' ? 'Sobras' : 'Faltas'}
                </ThemedText>
                <View style={styles.closeButtonPlaceholder} />
              </>
            ) : (
              <>
                <ThemedText type="title" style={styles.modalTitle}>
                  Conciliação Bancária
                </ThemedText>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <IconSymbol name="xmark.circle.fill" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Lista dedicada: Sobras ou Faltas */}
          {listViewMode && !loading && (
            <View style={styles.dedicatedListContainer}>
              <SobrasFaltasListView
                mode={listViewMode}
                items={
                  listViewMode === 'sobras'
                    ? sobrasFaltasSummary.sobras.items
                    : sobrasFaltasSummary.faltas.items
                }
                total={
                  listViewMode === 'sobras'
                    ? sobrasFaltasSummary.sobras.total
                    : sobrasFaltasSummary.faltas.total
                }
                onSelectTransaction={(id) => {
                  setSelectedTransaction(id);
                  setSelectedTitle(null);
                  setListViewMode(null);
                }}
                onSelectTitle={(id) => {
                  setSelectedTitle(id);
                  setSelectedTransaction(null);
                  setListViewMode(null);
                }}
              />
            </View>
          )}

          {/* Conteúdo principal (quando não está na lista dedicada) */}
          {!listViewMode && (
            <ScrollView
              style={styles.mainScroll}
              contentContainerStyle={styles.mainScrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled">
          {/* Filtros e Ações */}
          <View style={styles.actionsRow}>
            <GlassContainer style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  const accounts = [null, ...contas.map((c) => c.id)];
                  const currentIndex = accounts.indexOf(filterAccount);
                  const nextIndex = (currentIndex + 1) % accounts.length;
                  setFilterAccount(accounts[nextIndex] || null);
                }}
                activeOpacity={0.7}>
                <IconSymbol name="line.3.horizontal.decrease" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.filterText}>
                  {filterAccount
                    ? contas.find((c) => c.id === filterAccount)?.descricao || 'Todas'
                    : 'Todas as contas'}
                </Text>
              </TouchableOpacity>
            </GlassContainer>

            <TouchableOpacity
              style={styles.matchButton}
              onPress={generateAutoMatches}
              disabled={matching}
              activeOpacity={0.7}>
              <IconSymbol
                name={matching ? 'hourglass' : 'sparkles'}
                size={16}
                color={matching ? 'rgba(255, 255, 255, 0.5)' : '#FFFFFF'}
              />
              <Text style={[styles.matchButtonText, matching && styles.matchButtonTextDisabled]}>
                {matching ? 'Buscando...' : 'Match Automático'}
              </Text>
            </TouchableOpacity>
            {(selectedTransaction || selectedTitle) && (
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => {
                  setSelectedTransaction(null);
                  setSelectedTitle(null);
                }}
                activeOpacity={0.7}>
                <IconSymbol name="xmark.circle.fill" size={16} color="rgba(255, 255, 255, 0.7)" />
                <Text style={styles.clearSelectionText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dica de uso */}
          {!loading && (transactions.length > 0 || titles.length > 0) && (
            <View style={styles.hintBar}>
              <IconSymbol name="info.circle.fill" size={14} color="rgba(255, 255, 255, 0.5)" />
              <ThemedText style={styles.hintText} numberOfLines={2}>
                Selecione um item de cada coluna e toque em Conciliar
              </ThemedText>
            </View>
          )}

          {/* Aviso quando não há sugestões de match (só na tela de conciliação) */}
          {!loading && !matching && matchWasRunWithZeroSuggestions && suggestions.length === 0 && (
            <View style={styles.noSuggestionsBanner}>
              <View style={styles.noSuggestionsIconWrap}>
                <MaterialIcons name="info-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.noSuggestionsTextWrap}>
                <ThemedText type="defaultSemiBold" style={styles.noSuggestionsTitle}>
                  Nenhuma sugestão encontrada
                </ThemedText>
                <ThemedText style={styles.noSuggestionsMessage}>
                  Tente conciliar manualmente: selecione uma transação na coluna da esquerda (Banco) e um título na coluna da direita (ERP), depois toque em Conciliar.
                </ThemedText>
              </View>
            </View>
          )}

          {/* Seção explícita: Sobras e Faltas — listas dedicadas */}
          <SobrasFaltasSection
            summary={sobrasFaltasSummary}
            loading={loading}
            activeTab={sobrasFaltasActiveTab}
            onTabChange={setSobrasFaltasActiveTab}
            onSelectTransaction={(id) => {
              setSelectedTransaction(id);
              setSelectedTitle(null);
            }}
            onSelectTitle={(id) => {
              setSelectedTitle(id);
              setSelectedTransaction(null);
            }}
            onViewFullList={setListViewMode}
            style={styles.sobrasFaltasSection}
            animateIn={sobrasFaltasAnim}
          />

          {/* Sugestões */}
          {visibleSuggestions.length > 0 && (
            <Animated.View
              style={[styles.suggestionsContainer, suggestionStyle]}>
              <GlassContainer style={styles.suggestionsCard}>
                <View style={styles.suggestionsHeader}>
                  <IconSymbol name="sparkles" size={18} color="#00b09b" />
                  <ThemedText type="defaultSemiBold" style={styles.suggestionsTitle}>
                    {visibleSuggestions.length} {visibleSuggestions.length === 1 ? 'Sugestão' : 'Sugestões'}
                  </ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsList}>
                  {visibleSuggestions.slice(0, 5).map((suggestion) => (
                    <TouchableOpacity
                      key={`${suggestion.transaction.id}-${suggestion.title.id}`}
                      style={styles.suggestionCard}
                      onPress={() => handleAcceptSuggestion(suggestion)}
                      activeOpacity={0.7}>
                      <View style={styles.suggestionHeader}>
                        <View
                          style={[
                            styles.matchBadge,
                            { backgroundColor: `${getMatchTypeColor(suggestion.matchType)}20` },
                          ]}>
                          <Text style={[styles.matchBadgeText, { color: getMatchTypeColor(suggestion.matchType) }]}>
                            {Math.round(suggestion.score)}%
                          </Text>
                        </View>
                      </View>
                      <View style={styles.suggestionContent}>
                        <ThemedText style={styles.suggestionTx} numberOfLines={1}>
                          {suggestion.transaction.descricao}
                        </ThemedText>
                        <ThemedText style={styles.suggestionTitle} numberOfLines={1}>
                          {suggestion.title.fornecedor_cliente}
                        </ThemedText>
                        <Text style={styles.suggestionValue}>
                          {formatCurrency(suggestion.transaction.valor)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </GlassContainer>
            </Animated.View>
          )}

          {/* Duas Colunas */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00b09b" />
              <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
            </View>
          ) : (
            <View style={styles.columnsContainer}>
              {/* Coluna Esquerda: Banco */}
              <Animated.View
                style={[
                  styles.column,
                  {
                    opacity: leftColumnAnim,
                    transform: [
                      {
                        translateX: leftColumnAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <GlassContainer style={styles.columnHeader}>
                  <View style={styles.columnHeaderContent}>
                    <IconSymbol name="building.columns.fill" size={18} color="#00b09b" />
                    <ThemedText type="defaultSemiBold" style={styles.columnTitle}>
                      Banco
                    </ThemedText>
                    <View style={styles.columnBadge}>
                      <Text style={styles.columnBadgeText}>{transactions.length}</Text>
                    </View>
                  </View>
                </GlassContainer>

                <ScrollView
                  style={styles.columnScroll}
                  contentContainerStyle={[styles.columnContent, styles.columnScrollContent]}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  nestedScrollEnabled
                  bounces={false}
                  {...(Platform.OS === 'android' && { overScrollMode: 'never' as const })}>
                  {transactions.length === 0 ? (
                    <View style={styles.emptyColumn}>
                      <IconSymbol name="checkmark.circle" size={28} color="rgba(255, 255, 255, 0.3)" />
                      <ThemedText style={styles.emptyColumnText}>Tudo conciliado!</ThemedText>
                    </View>
                  ) : (
                    transactions.map((transaction) => {
                      const isSelected = selectedTransaction === transaction.id;
                      const suggestion = visibleSuggestions.find((s) => s.transaction.id === transaction.id);

                      return (
                        <TouchableOpacity
                          key={transaction.id}
                          style={[
                            styles.itemCard,
                            isSelected && styles.itemCardSelected,
                            suggestion && styles.itemCardSuggested,
                          ]}
                          onPress={() => handleSelectTransaction(transaction.id!)}
                          activeOpacity={0.7}>
                          <View style={styles.itemIcon}>
                            <View
                              style={[
                                styles.itemIconInner,
                                {
                                  backgroundColor:
                                    transaction.tipo === 'receita'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(239, 68, 68, 0.2)',
                                },
                              ]}>
                              <IconSymbol
                                name={transaction.tipo === 'receita' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'}
                                size={12}
                                color={transaction.tipo === 'receita' ? '#10B981' : '#EF4444'}
                              />
                            </View>
                          </View>
                          <View style={styles.itemContent}>
                            <ThemedText type="defaultSemiBold" style={styles.itemDescription} numberOfLines={2} ellipsizeMode="tail">
                              {transaction.descricao || '—'}
                            </ThemedText>
                            <View style={styles.itemBottomSection}>
                              <View style={styles.itemMetaRow}>
                                <ThemedText style={styles.itemMeta}>
                                  {formatDate(transaction.data)}
                                </ThemedText>
                                <View style={styles.pendenteBadge}>
                                  <Text style={styles.pendenteBadgeText} numberOfLines={1}>Pendente</Text>
                                </View>
                              </View>
                              <Text
                                style={[
                                  styles.itemValue,
                                  { color: transaction.tipo === 'receita' ? '#10B981' : '#EF4444' },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                adjustsFontSizeToFit={true}>
                                {transaction.tipo === 'receita' ? '+' : '-'}
                                {formatCurrency(transaction.valor)}
                              </Text>
                            </View>
                          </View>
                          {suggestion && (
                            <View style={styles.suggestionIndicator}>
                              <IconSymbol name="sparkles" size={10} color="#00b09b" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </Animated.View>

              {/* Coluna Direita: ERP */}
              <Animated.View
                style={[
                  styles.column,
                  {
                    opacity: rightColumnAnim,
                    transform: [
                      {
                        translateX: rightColumnAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [30, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                <GlassContainer style={styles.columnHeader}>
                  <View style={styles.columnHeaderContent}>
                    <IconSymbol name="creditcard.fill" size={18} color="#00b09b" />
                    <ThemedText type="defaultSemiBold" style={styles.columnTitle}>
                      ERP
                    </ThemedText>
                    <View style={styles.columnBadge}>
                      <Text style={styles.columnBadgeText}>{titles.length}</Text>
                    </View>
                  </View>
                </GlassContainer>

                <ScrollView
                  style={styles.columnScroll}
                  contentContainerStyle={[styles.columnContent, styles.columnScrollContent]}
                  showsVerticalScrollIndicator={true}
                  scrollEventThrottle={16}
                  nestedScrollEnabled
                  bounces={false}
                  {...(Platform.OS === 'android' && { overScrollMode: 'never' as const })}>
                  {titles.length === 0 ? (
                    <View style={styles.emptyColumn}>
                      <IconSymbol name="checkmark.circle" size={28} color="rgba(255, 255, 255, 0.3)" />
                      <ThemedText style={styles.emptyColumnText}>Tudo conciliado!</ThemedText>
                    </View>
                  ) : (
                    titles.map((title) => {
                      const isSelected = selectedTitle === title.id;
                      const suggestion = visibleSuggestions.find((s) => s.title.id === title.id);

                      return (
                        <TouchableOpacity
                          key={title.id}
                          style={[
                            styles.itemCard,
                            isSelected && styles.itemCardSelected,
                            suggestion && styles.itemCardSuggested,
                          ]}
                          onPress={() => handleSelectTitle(title.id!)}
                          activeOpacity={0.7}>
                          <View style={styles.itemIcon}>
                            <View
                              style={[
                                styles.itemIconInner,
                                {
                                  backgroundColor:
                                    title.tipo === 'receber'
                                      ? 'rgba(16, 185, 129, 0.2)'
                                      : 'rgba(239, 68, 68, 0.2)',
                                },
                              ]}>
                              <IconSymbol
                                name={title.tipo === 'receber' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'}
                                size={12}
                                color={title.tipo === 'receber' ? '#10B981' : '#EF4444'}
                              />
                            </View>
                          </View>
                          <View style={styles.itemContent}>
                            <ThemedText type="defaultSemiBold" style={styles.itemDescription} numberOfLines={2} ellipsizeMode="tail">
                              {title.fornecedor_cliente || '—'}
                            </ThemedText>
                            <View style={styles.itemBottomSection}>
                              <View style={styles.itemMetaRow}>
                                <ThemedText style={styles.itemMeta}>
                                  {formatDate(title.data_vencimento)}
                                </ThemedText>
                                <View style={styles.pendenteBadge}>
                                  <Text style={styles.pendenteBadgeText} numberOfLines={1}>Pendente</Text>
                                </View>
                              </View>
                              <Text
                                style={[
                                  styles.itemValue,
                                  { color: title.tipo === 'receber' ? '#10B981' : '#EF4444' },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                                adjustsFontSizeToFit={true}>
                                {title.tipo === 'receber' ? '+' : '-'}
                                {formatCurrency(title.valor)}
                              </Text>
                            </View>
                          </View>
                          {suggestion && (
                            <View style={styles.suggestionIndicator}>
                              <IconSymbol name="sparkles" size={10} color="#00b09b" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </Animated.View>
            </View>
          )}

          {/* Botão de Conciliação Manual */}
          {selectedTransaction && selectedTitle && (
            <View style={styles.reconcileButtonContainer}>
              <TouchableOpacity
                style={styles.reconcileButton}
                onPress={() => handleReconcile(selectedTransaction, selectedTitle)}
                activeOpacity={0.8}>
                <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.reconcileButtonText}>Conciliar Selecionados</Text>
              </TouchableOpacity>
            </View>
          )}
            </ScrollView>
          )}
        </View>
      </View>
      <Toast config={toastConfig} topOffset={60} />
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
    minHeight: 0, // Permite que o flex funcione corretamente
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  modalTitleWithBack: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 4,
  },
  closeButtonPlaceholder: {
    width: 36,
  },
  closeButton: {
    padding: 4,
  },
  dedicatedListContainer: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  dedicatedListHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dedicatedListSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 10,
  },
  dedicatedListStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  dedicatedListBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  dedicatedListBadgeFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  dedicatedListBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  dedicatedListBadgeTextFaltas: {
    color: '#6366F1',
  },
  dedicatedListTotal: {
    fontSize: 16,
    fontWeight: '700',
  },
  dedicatedListScroll: {
    flex: 1,
  },
  dedicatedListContent: {
    paddingBottom: 24,
  },
  dedicatedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dedicatedListItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  dedicatedListItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dedicatedListItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  dedicatedListItemDesc: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dedicatedListItemMeta: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  dedicatedListItemValue: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContainer: {
    flex: 1,
    padding: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  matchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#00b09b',
  },
  matchButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  matchButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  clearSelectionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mainScroll: {
    flex: 1,
    minHeight: 0,
  },
  mainScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 18,
    minWidth: 0,
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsCard: {
    padding: 12,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  suggestionsList: {
    marginTop: 4,
  },
  suggestionCard: {
    width: 140,
    marginRight: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 155, 0.3)',
  },
  suggestionHeader: {
    marginBottom: 6,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  suggestionContent: {
    gap: 3,
  },
  suggestionTx: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  suggestionTitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  suggestionValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  columnsContainer: {
    flexDirection: 'row',
    gap: COLUMN_GAP,
    paddingHorizontal: COLUMN_PADDING,
    marginTop: 8,
    minHeight: 320,
    flexGrow: 1,
  },
  column: {
    flex: 1,
    minWidth: CARD_MIN_WIDTH,
    minHeight: 280,
  },
  columnHeader: {
    padding: 10,
    marginBottom: 8,
  },
  columnHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnTitle: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
  },
  columnBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
  },
  columnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00b09b',
  },
  columnScroll: {
    flex: 1,
    minHeight: 240,
  },
  columnContent: {
    gap: 6,
  },
  columnScrollContent: {
    paddingBottom: 24,
  },
  emptyColumn: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyColumnText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
    overflow: 'hidden',
  },
  itemCardSelected: {
    backgroundColor: 'rgba(0, 176, 155, 0.15)',
    borderColor: '#00b09b',
    borderWidth: 2,
  },
  itemCardSuggested: {
    borderColor: 'rgba(0, 176, 155, 0.5)',
    borderWidth: 1.5,
  },
  itemIcon: {
    marginRight: 8,
  },
  itemIconInner: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  itemDescription: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 16,
  },
  itemBottomSection: {
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  itemMeta: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  pendenteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendenteBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },
  suggestionIndicator: {
    marginLeft: 2,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
    minWidth: 0,
  },
  reconcileButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  reconcileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#00b09b',
  },
  reconcileButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Banner: nenhuma sugestão (só na tela de conciliação)
  noSuggestionsBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  },
  noSuggestionsIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSuggestionsTextWrap: {
    flex: 1,
  },
  noSuggestionsTitle: {
    fontSize: 14,
    color: '#93C5FD',
    marginBottom: 4,
  },
  noSuggestionsMessage: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
  },
  // Seção Sobras e Faltas
  sobrasFaltasSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
    flexShrink: 0,
  },
  sobrasFaltasHeader: {
    marginBottom: 12,
  },
  sobrasFaltasTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sobrasFaltasTitle: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  sobrasFaltasSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 17,
    marginTop: 2,
  },
  sobrasFaltasCards: {
    flexDirection: 'row',
    gap: 12,
  },
  sobrasFaltasCard: {
    flex: 1,
    padding: 14,
    minHeight: 160,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  sobrasFaltasCardSobras: {
    borderLeftColor: '#10B981',
  },
  sobrasFaltasCardFaltas: {
    borderLeftColor: '#6366F1',
  },
  sobrasFaltasCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  sobrasFaltasCardLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  sobrasFaltasCardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  sobrasFaltasCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  sobrasFaltasBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sobrasFaltasBadgeFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  sobrasFaltasBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  sobrasFaltasBadgeTextFaltas: {
    color: '#6366F1',
  },
  sobrasFaltasTotal: {
    fontSize: 14,
    fontWeight: '700',
  },
  sobrasFaltasList: {
    maxHeight: 120,
  },
  sobrasFaltasListExpanded: {
    maxHeight: 220,
  },
  sobrasFaltasVerTodos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  sobrasFaltasVerTodosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  sobrasFaltasVerTodosFaltas: {
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  sobrasFaltasVerTodosTextFaltas: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  sobrasFaltasListItem: {
    paddingVertical: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sobrasFaltasListItemFirst: {
    borderTopWidth: 0,
    paddingTop: 4,
  },
  sobrasFaltasItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sobrasFaltasItemIcon: {
    marginRight: 0,
  },
  sobrasFaltasItemDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  sobrasFaltasItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sobrasFaltasItemDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sobrasFaltasItemValor: {
    fontSize: 11,
    fontWeight: '600',
  },
  sobrasFaltasMore: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 6,
    fontStyle: 'italic',
  },
  sobrasFaltasEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  sobrasFaltasEmptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 6,
  },
  sobrasFaltasEmptySubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
