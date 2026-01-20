import { AnimatedBackground } from '@/components/animated-background';
import { CSVImportModal } from '@/components/csv-import-modal';
import { GlassContainer } from '@/components/glass-container';
import { NewTransactionModal } from '@/components/new-transaction-modal';
import { ReportsModal } from '@/components/reports-modal';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [csvImportVisible, setCsvImportVisible] = React.useState(false);
  const [reportsVisible, setReportsVisible] = React.useState(false);
  const [newTransactionVisible, setNewTransactionVisible] = React.useState(false);
  const insets = useSafeAreaInsets();

  // Animações
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const balanceCardAnim = React.useRef(new Animated.Value(0)).current;
  const incomeCardAnim = React.useRef(new Animated.Value(0)).current;
  const expenseCardAnim = React.useRef(new Animated.Value(0)).current;
  const transactionsAnim = React.useRef(new Animated.Value(0)).current;
  const actionsAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim3 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim4 = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Animação de entrada escalonada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(balanceCardAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(incomeCardAnim, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(expenseCardAnim, {
        toValue: 1,
        duration: 500,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(transactionsAnim, {
        toValue: 1,
        duration: 500,
        delay: 350,
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Animações de press para botões
  const scaleAnim1 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim2 = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn1 = () => {
    Animated.spring(scaleAnim1, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut1 = () => {
    Animated.spring(scaleAnim1, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const handlePressIn2 = () => {
    Animated.spring(scaleAnim2, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut2 = () => {
    Animated.spring(scaleAnim2, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const handlePressIn3 = () => {
    Animated.spring(scaleAnim3, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut3 = () => {
    Animated.spring(scaleAnim3, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };
  const handlePressIn4 = () => {
    Animated.spring(scaleAnim4, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut4 = () => {
    Animated.spring(scaleAnim4, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Dados mockados - serão substituídos pela API
  const financialData = {
    balance: 'R$ 245.890,50',
    income: 'R$ 180.500,00',
    expense: 'R$ 134.609,50',
  };

  const recentTransactions = [
    { id: '1', description: 'Pagamento de fornecedor', amount: '-R$ 5.000,00', date: 'Hoje', type: 'expense' },
    { id: '2', description: 'Recebimento cliente ABC', amount: '+R$ 12.500,00', date: 'Ontem', type: 'income' },
    { id: '3', description: 'Salário funcionários', amount: '-R$ 45.000,00', date: '15/01', type: 'expense' },
    { id: '4', description: 'Venda produto XYZ', amount: '+R$ 8.300,00', date: '14/01', type: 'income' },
  ];

  // Animações para cada item de transação
  const transactionAnims = recentTransactions.map(() => React.useRef(new Animated.Value(0)).current);

  React.useEffect(() => {
    // Animar cada item de transação com delay escalonado
    transactionAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 450 + (index * 50),
        useNativeDriver: true,
      }).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}>
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <ThemedText type="title" style={styles.greeting}>
            Olá, Empresa
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Resumo financeiro
          </ThemedText>
        </Animated.View>

        {/* Financial Cards */}
        <View style={styles.cardsContainer}>
          {/* Saldo Total - Retângulo Horizontal */}
          <Animated.View
            style={{
              opacity: balanceCardAnim,
              transform: [
                {
                  translateY: balanceCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
                {
                  scale: balanceCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}>
            <GlassContainer style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={[styles.balanceIconContainer, { backgroundColor: '#00b09b20' }]}>
                <IconSymbol name="dollarsign.circle.fill" size={28} color="#00b09b" />
              </View>
              <ThemedText style={styles.balanceTitle} type="defaultSemiBold">
                Saldo Total
              </ThemedText>
            </View>
            <Text style={styles.balanceAmount}>
              {financialData.balance}
            </Text>
            <View style={styles.balanceTrend}>
              <IconSymbol name="arrow.up.right" size={14} color="#10B981" />
              <Text style={styles.balanceTrendText}>
                +12,5%
              </Text>
            </View>
          </GlassContainer>
          </Animated.View>

          {/* Receitas e Despesas - Dois Quadrados */}
          <View style={styles.incomeExpenseRow}>
            <Animated.View
              style={{
                flex: 1,
                opacity: incomeCardAnim,
                transform: [
                  {
                    translateY: incomeCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: incomeCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}>
              <GlassContainer style={styles.squareCard}>
              <View style={styles.squareHeader}>
                <View style={[styles.squareIconContainer, { backgroundColor: '#10B98120' }]}>
                  <IconSymbol name="arrow.down.circle.fill" size={18} color="#10B981" />
                </View>
                <Text style={[styles.squareTitle, { color: '#10B981', fontWeight: '600' }]}>
                  Receitas
                </Text>
              </View>
              <Text style={styles.squareAmount}>
                {financialData.income}
              </Text>
              <View style={styles.squareTrend}>
                <IconSymbol name="arrow.up.right" size={12} color="#10B981" />
                <Text style={styles.squareTrendText}>
                  +8,2%
                </Text>
              </View>
            </GlassContainer>
            </Animated.View>

            <Animated.View
              style={{
                flex: 1,
                opacity: expenseCardAnim,
                transform: [
                  {
                    translateY: expenseCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: expenseCardAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              }}>
              <GlassContainer style={styles.squareCard}>
              <View style={styles.squareHeader}>
                <View style={[styles.squareIconContainer, { backgroundColor: '#EF444420' }]}>
                  <IconSymbol name="arrow.up.circle.fill" size={18} color="#EF4444" />
                </View>
                <Text style={[styles.squareTitle, { color: '#EF4444', fontWeight: '600' }]}>
                  Despesas
                </Text>
              </View>
              <Text style={styles.squareAmount}>
                {financialData.expense}
              </Text>
              <View style={styles.squareTrend}>
                <IconSymbol name="arrow.down.right" size={12} color="#EF4444" />
                <Text style={[styles.squareTrendText, { color: '#EF4444' }]}>
                  -3,1%
                </Text>
              </View>
            </GlassContainer>
            </Animated.View>
          </View>
        </View>

        {/* Recent Transactions */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: transactionsAnim,
              transform: [
                {
                  translateY: transactionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Transações Recentes</ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} activeOpacity={0.7}>
              <Text style={styles.seeAll}>
              Ver todas
              </Text>
            </TouchableOpacity>
          </View>

          <GlassContainer style={styles.transactionsCard}>
            {recentTransactions.map((transaction, index) => (
              <Animated.View
                key={transaction.id}
                style={{
                  opacity: transactionAnims[index],
                  transform: [
                    {
                      translateX: transactionAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, 0],
                      }),
                    },
                  ],
                }}>
                <TouchableOpacity
                  style={[
                    styles.transactionItem,
                    index < recentTransactions.length - 1 && styles.transactionItemBorder
                  ]}
                  onPress={() => router.push('/(tabs)/transactions')}
                  activeOpacity={0.7}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIcon,
                      {
                        backgroundColor:
                          transaction.type === 'income'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}>
                    <Text
                      style={{
                        color: transaction.type === 'income' ? '#10B981' : '#EF4444',
                        fontSize: 18,
                        fontWeight: 'bold',
                      }}>
                      {transaction.type === 'income' ? '+' : '-'}
                    </Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.transactionDescription}>
                      {transaction.description}
                    </ThemedText>
                    <ThemedText style={styles.transactionDate}>
                      {transaction.date}
                    </ThemedText>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? '#10B981' : '#EF4444',
                    },
                  ]}>
                  {transaction.amount}
                </Text>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </GlassContainer>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: actionsAnim,
              transform: [
                {
                  translateY: actionsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ações Rápidas
          </ThemedText>
          <View style={styles.quickActionsContainer}>
            <View style={styles.quickActions}>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim1 }] }}>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/accounts')}
                onPressIn={handlePressIn1}
                onPressOut={handlePressOut1}
                activeOpacity={0.8}>
                <GlassContainer style={styles.actionCard}>
                  <View style={styles.actionCardContent}>
                    <View style={[styles.actionIconContainer, { backgroundColor: '#00b09b20' }]}>
                      <MaterialIcons name="account-balance-wallet" size={20} color="#00b09b" />
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.actionText}>
                      Contas Bancárias
                    </ThemedText>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim2 }] }}>
              <TouchableOpacity
                onPress={() => setNewTransactionVisible(true)}
                onPressIn={handlePressIn2}
                onPressOut={handlePressOut2}
                activeOpacity={0.8}>
                <GlassContainer style={styles.actionCard}>
                  <View style={styles.actionCardContent}>
                    <View style={[styles.actionIconContainer, { backgroundColor: '#10B98120' }]}>
                      <IconSymbol name="plus.circle.fill" size={20} color="#10B981" />
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.actionText}>
                      Nova Transação
                    </ThemedText>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
            </View>
            
            {/* Segunda linha de ações */}
            <View style={styles.quickActions}>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim3 }] }}>
              <TouchableOpacity
                onPress={() => setCsvImportVisible(true)}
                onPressIn={handlePressIn3}
                onPressOut={handlePressOut3}
                activeOpacity={0.8}>
                <GlassContainer style={styles.actionCard}>
                  <View style={styles.actionCardContent}>
                    <View style={[styles.actionIconContainer, { backgroundColor: '#3B82F620' }]}>
                      <MaterialIcons name="upload-file" size={20} color="#3B82F6" />
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.actionText}>
                      Importar CSV
                    </ThemedText>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim4 }] }}>
              <TouchableOpacity
                onPress={() => setReportsVisible(true)}
                onPressIn={handlePressIn4}
                onPressOut={handlePressOut4}
                activeOpacity={0.8}>
                <GlassContainer style={styles.actionCard}>
                  <View style={styles.actionCardContent}>
                    <View style={[styles.actionIconContainer, { backgroundColor: '#F59E0B20' }]}>
                      <IconSymbol name="chart.bar.fill" size={20} color="#F59E0B" />
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.actionText}>
                      Relatórios
                    </ThemedText>
                  </View>
                </GlassContainer>
              </TouchableOpacity>
            </Animated.View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modais */}
      <CSVImportModal
        visible={csvImportVisible}
        onClose={() => setCsvImportVisible(false)}
        onSuccess={() => {
          // Recarregar dados após importação bem-sucedida
          onRefresh();
        }}
      />
      <ReportsModal
        visible={reportsVisible}
        onClose={() => setReportsVisible(false)}
      />
      <NewTransactionModal
        visible={newTransactionVisible}
        onClose={() => setNewTransactionVisible(false)}
        onSuccess={() => {
          // Recarregar dados após criar transação
          onRefresh();
        }}
      />
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
  header: {
    marginBottom: 24,
  },
  greeting: {
    marginBottom: 4,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  cardsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  balanceCard: {
    width: '100%',
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceTrendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    gap: 12,
  },
  squareCard: {
    flex: 1,
    minHeight: 120,
    maxHeight: 130,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  squareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  squareIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  squareTitle: {
    fontSize: 12,
    flex: 1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  squareAmount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    lineHeight: 22,
  },
  squareTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  squareTrendText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 20,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00b09b',
  },
  transactionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  transactionDate: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    minHeight: 80,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
});
