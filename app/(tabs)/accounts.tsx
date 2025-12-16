import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountsScreen() {
  const insets = useSafeAreaInsets();

  // Dados mockados - serão substituídos pela API
  const accounts = [
    {
      id: '1',
      name: 'Banco do Brasil',
      type: 'Conta Corrente',
      accountNumber: '****1234',
      balance: 'R$ 125.450,00',
      bankCode: '001',
    },
    {
      id: '2',
      name: 'Itaú',
      type: 'Conta Corrente',
      accountNumber: '****5678',
      balance: 'R$ 89.320,50',
      bankCode: '341',
    },
    {
      id: '3',
      name: 'Bradesco',
      type: 'Conta Poupança',
      accountNumber: '****9012',
      balance: 'R$ 31.120,00',
      bankCode: '237',
    },
  ];

  const getBankIcon = (bankCode: string) => {
    // Ícones baseados no código do banco
    return 'building.columns.fill';
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>Contas Bancárias</ThemedText>
          <ThemedText style={styles.subtitle}>
            {accounts.length} conta{accounts.length !== 1 ? 's' : ''} conectada{accounts.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        <GlassContainer style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <Text style={styles.summaryLabel}>
            Saldo Total
            </Text>
            <Text style={styles.summaryAmount}>
            R$ 245.890,50
            </Text>
          </View>
        </GlassContainer>

        <View style={styles.accountsList}>
          {accounts.map((account) => (
            <GlassContainer key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.bankIcon}>
                  <IconSymbol name="building.columns.fill" size={24} color="#00b09b" />
                </View>
                <View style={styles.accountInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.accountName}>
                    {account.name}
                  </ThemedText>
                  <ThemedText style={styles.accountType}>
                    {account.type} • {account.accountNumber}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.accountBalance}>
                <Text style={styles.balanceLabel}>
                  Saldo disponível
                </Text>
                <Text style={styles.balanceAmount}>
                  {account.balance}
                </Text>
              </View>
            </GlassContainer>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addAccountCard}
          onPress={() => {
            // Navegar para adicionar conta
            console.log('Adicionar nova conta');
          }}
          activeOpacity={0.7}>
          <IconSymbol name="plus.circle.fill" size={32} color="#00b09b" />
          <Text style={styles.addAccountText}>
            Conectar Nova Conta
          </Text>
        </TouchableOpacity>
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
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryCard: {
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00b09b',
  },
  accountsList: {
    gap: 16,
    marginBottom: 16,
  },
  accountCard: {
    padding: 16,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    color: '#FFFFFF',
  },
  accountType: {
    fontSize: 12,
    marginTop: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  accountBalance: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addAccountCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#00b09b',
    borderStyle: 'dashed',
  },
  addAccountText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#00b09b',
  },
});
