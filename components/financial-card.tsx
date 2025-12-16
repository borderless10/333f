import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';

export type FinancialCardProps = {
  title: string;
  amount: string;
  type: 'income' | 'expense' | 'balance';
  icon?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
};

export function FinancialCard({ title, amount, type, icon, trend }: FinancialCardProps) {
  const getTypeColor = () => {
    switch (type) {
      case 'income':
        return '#10B981';
      case 'expense':
        return '#EF4444';
      case 'balance':
        return '#00b09b';
      default:
        return '#FFFFFF';
    }
  };

  const getIconName = (): 'arrow.down.circle.fill' | 'arrow.up.circle.fill' | 'dollarsign.circle.fill' | 'circle.fill' => {
    if (icon) return icon as any;
    switch (type) {
      case 'income':
        return 'arrow.down.circle.fill';
      case 'expense':
        return 'arrow.up.circle.fill';
      case 'balance':
        return 'dollarsign.circle.fill';
      default:
        return 'circle.fill';
    }
  };

  return (
    <GlassContainer style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: getTypeColor() + '20' }]}>
          <IconSymbol name={getIconName()} size={24} color={getTypeColor()} />
        </View>
        <ThemedText style={styles.title} type="defaultSemiBold">
          {title}
        </ThemedText>
      </View>
      
      <Text style={[styles.amount, { color: '#FFFFFF' }]}>
        {amount}
      </Text>

      {trend && (
        <View style={styles.trend}>
          <IconSymbol
            name={trend.isPositive ? 'arrow.up.right' : 'arrow.down.right'}
            size={14}
            color={trend.isPositive ? '#10B981' : '#EF4444'}
          />
          <Text
            style={[
              styles.trendText,
              { color: trend.isPositive ? '#10B981' : '#EF4444' },
            ]}>
            {trend.value}
          </Text>
        </View>
      )}
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 160,
    marginRight: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    flex: 1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
