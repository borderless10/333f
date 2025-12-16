import { AnimatedBackground } from '@/components/animated-background';
import { FinancialCard } from '@/components/financial-card';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { router } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.greeting}>
            Olá, Empresa
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Resumo financeiro
          </ThemedText>
        </View>

        {/* Financial Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContent}>
          <FinancialCard
            title="Saldo Total"
            amount={financialData.balance}
            type="balance"
            trend={{ value: '+12,5%', isPositive: true }}
          />
          <FinancialCard
            title="Receitas"
            amount={financialData.income}
            type="income"
            trend={{ value: '+8,2%', isPositive: true }}
          />
          <FinancialCard
            title="Despesas"
            amount={financialData.expense}
            type="expense"
            trend={{ value: '-3,1%', isPositive: true }}
          />
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.section}>
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
              <TouchableOpacity
                key={transaction.id}
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
            ))}
          </GlassContainer>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ações Rápidas
          </ThemedText>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardPrimary]}
              onPress={() => router.push('/(tabs)/accounts')}
              activeOpacity={0.8}>
              <Text style={styles.actionText}>
                Contas Bancárias
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardSuccess]}
              onPress={() => router.push('/(tabs)/transactions')}
              activeOpacity={0.8}>
              <Text style={styles.actionText}>
                Nova Transação
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  },
  cardsContent: {
    paddingRight: 16,
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
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderRadius: 12,
  },
  actionCardPrimary: {
    backgroundColor: '#00b09b',
  },
  actionCardSuccess: {
    backgroundColor: '#10B981',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#FFFFFF',
  },
});
