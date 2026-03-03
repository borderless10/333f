/**
 * Lista dedicada de Sobras ou Faltas em tela cheia.
 * Usado quando o usuário clica em "Ver lista completa".
 */

import React, { useRef, useEffect } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { ThemedText } from './themed-text';
import { formatCurrency } from '@/lib/utils/currency';
import type { TitleWithAccount } from '@/lib/services/titles';
import type { TransactionWithAccount } from '@/lib/services/transactions';

interface SobrasFaltasListViewProps {
  mode: 'sobras' | 'faltas';
  items: TransactionWithAccount[] | TitleWithAccount[];
  total: number;
  onSelectTransaction?: (id: number) => void;
  onSelectTitle?: (id: number) => void;
}

function formatDate(dateString: string) {
  if (!dateString?.trim()) return '—';
  try {
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
}

function isTransaction(item: TransactionWithAccount | TitleWithAccount): item is TransactionWithAccount {
  return 'data' in item && 'descricao' in item;
}

export function SobrasFaltasListView({
  mode,
  items,
  total,
  onSelectTransaction,
  onSelectTitle,
}: SobrasFaltasListViewProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const subtitle =
    mode === 'sobras'
      ? 'Transações no extrato sem título no ERP'
      : 'Títulos no ERP sem transação no extrato';

  const handlePress = (item: TransactionWithAccount | TitleWithAccount) => {
    if (isTransaction(item)) {
      onSelectTransaction?.(item.id!);
    } else {
      onSelectTitle?.(item.id!);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        <View style={styles.stats}>
          <View style={[styles.badge, mode === 'faltas' && styles.badgeFaltas]}>
            <Text style={[styles.badgeText, mode === 'faltas' && styles.badgeTextFaltas]}>
              {items.length} {mode === 'sobras' ? 'transações' : 'títulos'}
            </Text>
          </View>
          <Text
            style={[
              styles.total,
              { color: total >= 0 ? '#10B981' : '#EF4444' },
            ]}>
            {formatCurrency(Math.abs(total))}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}>
        {items.map((item) => {
          const isTx = isTransaction(item);
          const tipo = isTx ? (item as TransactionWithAccount).tipo : (item as TitleWithAccount).tipo;
          const tipoLabel = isTx ? (tipo === 'receita' ? 'receita' : 'despesa') : (tipo === 'receber' ? 'receber' : 'pagar');
          const desc = isTx
            ? (item as TransactionWithAccount).descricao?.trim() || 'Sem descrição'
            : (item as TitleWithAccount).fornecedor_cliente?.trim() ||
              (item as TitleWithAccount).descricao?.trim() ||
              'Sem identificação';
          const dateStr = isTx
            ? formatDate((item as TransactionWithAccount).data)
            : `Venc. ${formatDate((item as TitleWithAccount).data_vencimento)}`;
          const valor = item.valor;
          const isPositive = (isTx && tipo === 'receita') || (!isTx && tipo === 'receber');

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${desc}, ${formatCurrency(valor)}, ${dateStr}`}
              accessibilityHint="Toque para selecionar e conciliar">
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.itemIcon,
                    { backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
                  ]}>
                  <IconSymbol
                    name={isPositive ? 'arrow.down.circle.fill' : 'arrow.up.circle.fill'}
                    size={18}
                    color={isPositive ? '#10B981' : '#EF4444'}
                  />
                </View>
                <View style={styles.itemInfo}>
                  <ThemedText type="defaultSemiBold" style={styles.itemDesc} numberOfLines={2}>
                    {desc}
                  </ThemedText>
                  <ThemedText style={styles.itemMeta}>
                    {dateStr} · Toque para selecionar e conciliar
                  </ThemedText>
                </View>
              </View>
              <Text
                style={[
                  styles.itemValue,
                  { color: isPositive ? '#10B981' : '#EF4444' },
                ]}>
                {isPositive ? '+' : '-'}
                {formatCurrency(valor)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    lineHeight: 19,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  badgeTextFaltas: {
    color: '#6366F1',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemDesc: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
  },
});
