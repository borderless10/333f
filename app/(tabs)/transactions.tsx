import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { buscarTransacoes, type TransactionWithAccount } from '@/lib/services/transactions';
import { formatCurrency } from '@/lib/utils/currency';
import { useScrollToTop } from '@/hooks/use-scroll-to-top';
import { useScreenAnimations } from '@/hooks/use-screen-animations';

type FilterType = 'all' | 'income' | 'expense';
type SortType = 'date-desc' | 'date-asc' | 'value-desc' | 'value-asc' | 'name-asc' | 'name-desc';

export default function TransactionsScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<TransactionWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const scrollRef = useScrollToTop(); // ✅ Hook para resetar scroll
  const { animatedStyle: headerStyle } = useScreenAnimations(0);
  const { animatedStyle: searchStyle } = useScreenAnimations(100);
  const { animatedStyle: filtersStyle } = useScreenAnimations(150);
  
  // Animações para itens da lista
  const [transactionAnims, setTransactionAnims] = useState<Animated.Value[]>([]);

  // Carrega transações do Supabase
  useEffect(() => {
    loadTransactions();
  }, [userId]);

  const loadTransactions = async () => {
    if (!userId) {
      console.log('📊 Transações: Aguardando userId...');
      setLoading(false);
      setTransactions([]);
      return;
    }

    try {
      console.log('📊 Transações: Carregando dados para userId:', userId);
      setLoading(true);
      const { data, error } = await buscarTransacoes(userId);
      
      if (error) {
        console.error('❌ Erro ao buscar transações:', error);
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      if (data) {
        console.log('✅ Transações carregadas:', data.length);
        setTransactions(data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Hoje';
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Filtro e ordenação com useMemo para otimização
  const filteredAndSortedTransactions = useMemo(() => {
    let result = transactions.filter((transaction) => {
      // Filtro por tipo (receita/despesa/todas)
      const tipo = transaction.tipo === 'receita' ? 'income' : 'expense';
      const matchesFilter = filter === 'all' || tipo === filter;
      
      // Filtro por busca (descrição, categoria ou conta)
      const contaDescricao = transaction.contas_bancarias?.descricao || 'Sem conta';
      const matchesSearch = searchQuery.trim() === '' || 
        transaction.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contaDescricao.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.data).getTime() - new Date(a.data).getTime();
        case 'date-asc':
          return new Date(a.data).getTime() - new Date(b.data).getTime();
        case 'value-desc':
          return b.valor - a.valor;
        case 'value-asc':
          return a.valor - b.valor;
        case 'name-asc':
          return a.descricao.localeCompare(b.descricao);
        case 'name-desc':
          return b.descricao.localeCompare(a.descricao);
        default:
          return 0;
      }
    });

    return result;
  }, [transactions, filter, searchQuery, sortBy]);

  // Animações para itens da lista (após filteredAndSortedTransactions ser definido)
  useEffect(() => {
    const anims = filteredAndSortedTransactions.map(() => new Animated.Value(0));
    setTransactionAnims(anims);
    
    anims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 200 + (index * 50),
        useNativeDriver: true,
      }).start();
    });
  }, [filteredAndSortedTransactions.length]);

  const FilterButton = ({ type, label }: { type: FilterType; label: string }) => {
    const isActive = filter === type;
    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          isActive && styles.filterButtonActive,
          !isActive && styles.filterButtonInactive,
        ]}
        onPress={() => setFilter(type)}
        activeOpacity={0.7}>
        <Text style={[styles.filterText, isActive && styles.filterTextActive, !isActive && styles.filterTextInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ActivityIndicator size="large" color="#00b09b" />
          <ThemedText style={styles.loadingText}>Carregando transações...</ThemedText>
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
        <Animated.View style={[styles.header, headerStyle]}>
          <ThemedText type="title" style={styles.title}>Transações</ThemedText>
          <ThemedText style={styles.subtitle}>
            {transactions.length} transaç{transactions.length !== 1 ? 'ões' : 'ão'} registrada{transactions.length !== 1 ? 's' : ''}
          </ThemedText>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View style={searchStyle}>
          <GlassContainer style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <IconSymbol name="magnifyingglass" size={20} color="rgba(255, 255, 255, 0.6)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por descrição, categoria ou conta..."
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

        {/* Sort and Filters Row */}
        <Animated.View style={[styles.controlsRow, filtersStyle]}>
          {/* Sort Selector */}
          <GlassContainer style={styles.sortContainer}>
            <IconSymbol name="arrow.up.arrow.down" size={16} color="rgba(255, 255, 255, 0.6)" />
            <View style={styles.sortPicker}>
              <TouchableOpacity
                onPress={() => {
                  // Cicla entre as opções de ordenação
                  const sortOptions: SortType[] = [
                    'date-desc', 'date-asc', 'value-desc', 'value-asc', 'name-asc', 'name-desc'
                  ];
                  const currentIndex = sortOptions.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sortOptions.length;
                  setSortBy(sortOptions[nextIndex]);
                }}
                style={styles.sortButton}>
                <Text style={styles.sortText}>{getSortLabel(sortBy)}</Text>
              </TouchableOpacity>
            </View>
          </GlassContainer>
        </Animated.View>

        {/* Filters */}
        <Animated.View style={[styles.filters, filtersStyle]}>
          <FilterButton type="all" label="Todas" />
          <FilterButton type="income" label="Receitas" />
          <FilterButton type="expense" label="Despesas" />
        </Animated.View>

        {/* Transactions List */}
        {filteredAndSortedTransactions.length === 0 ? (
          <GlassContainer style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color="rgba(255, 255, 255, 0.5)" />
            <ThemedText style={styles.emptyStateText}>
              Nenhuma transação encontrada
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              {searchQuery ? 'Tente buscar com outros termos' : 'Não há transações para exibir'}
            </ThemedText>
          </GlassContainer>
        ) : (
          <View style={styles.transactionsList}>
            {filteredAndSortedTransactions.map((transaction, index) => {
              const tipo = transaction.tipo === 'receita' ? 'income' : 'expense';
              const contaDescricao = transaction.contas_bancarias?.descricao || 'Sem conta';
              
              return (
                <Animated.View
                  key={transaction.id}
                  style={transactionAnims[index] ? {
                    opacity: transactionAnims[index],
                    transform: [
                      {
                        translateX: transactionAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  } : { opacity: 0 }}>
                  <GlassContainer style={styles.transactionCard}>
                  <View style={styles.transactionHeader}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor:
                            tipo === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        },
                      ]}>
                      <IconSymbol
                        name={tipo === 'income' ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'}
                        size={20}
                        color={tipo === 'income' ? '#10B981' : '#EF4444'}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <ThemedText type="defaultSemiBold" style={styles.transactionDescription}>
                        {transaction.descricao}
                      </ThemedText>
                      <ThemedText style={styles.transactionMeta}>
                        {transaction.categoria} • {contaDescricao}
                      </ThemedText>
                    </View>
                    <View style={styles.transactionAmount}>
                      <Text
                        style={[
                          styles.amountText,
                          {
                            color: tipo === 'income' ? '#10B981' : '#EF4444',
                          },
                        ]}>
                        {tipo === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.valor)}
                      </Text>
                      <ThemedText style={styles.transactionDate}>
                        {formatDate(transaction.data)}
                      </ThemedText>
                    </View>
                    </View>
                  </GlassContainer>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getSortLabel(sortBy: SortType): string {
  const labels: Record<SortType, string> = {
    'date-desc': 'Data ↓',
    'date-asc': 'Data ↑',
    'value-desc': 'Valor ↓',
    'value-asc': 'Valor ↑',
    'name-asc': 'Nome A-Z',
    'name-desc': 'Nome Z-A',
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
  controlsRow: {
    marginBottom: 12,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  sortPicker: {
    flex: 1,
  },
  sortButton: {
    paddingVertical: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  filterButtonActive: {
    backgroundColor: '#00b09b',
  },
  filterButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    color: '#FFFFFF',
  },
  transactionMeta: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    marginTop: 24,
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
});
