/**
 * Seção explícita de Sobras e Faltas para conciliação bancária.
 * Lista dedicada de transações sem título (sobras) e títulos sem transação (faltas).
 *
 * Design: minimalista, clean, com UX focada em descoberta e ação rápida.
 * Responsivo: mobile-first, cards empilham em telas estreitas.
 * Acessibilidade: labels e hints para leitores de tela.
 * Animações: transição suave na entrada e microinterações nos itens.
 */

import React from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { IconSymbol } from './ui/icon-symbol';
import { GlassContainer } from './glass-container';
import { ThemedText } from './themed-text';
import { formatCurrency } from '@/lib/utils/currency';
import type { TitleWithAccount } from '@/lib/services/titles';
import type { TransactionWithAccount } from '@/lib/services/transactions';

const PREVIEW_LIMIT = 5;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_NARROW = SCREEN_WIDTH < 400;

// Habilita LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface SobrasFaltasSummary {
  sobras: { count: number; total: number; items: TransactionWithAccount[] };
  faltas: { count: number; total: number; items: TitleWithAccount[] };
}

interface SobrasFaltasSectionProps {
  summary: SobrasFaltasSummary;
  loading?: boolean;
  activeTab: 'sobras' | 'faltas' | null;
  onTabChange: (tab: 'sobras' | 'faltas' | null) => void;
  onSelectTransaction: (id: number) => void;
  onSelectTitle: (id: number) => void;
  onViewFullList: (mode: 'sobras' | 'faltas') => void;
  style?: object;
  animateIn?: Animated.Value;
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

export function SobrasFaltasSection({
  summary,
  loading = false,
  activeTab,
  onTabChange,
  onSelectTransaction,
  onSelectTitle,
  onViewFullList,
  style,
  animateIn,
}: SobrasFaltasSectionProps) {
  const hasSobras = summary.sobras.count > 0;
  const hasFaltas = summary.faltas.count > 0;
  const hasAny = hasSobras || hasFaltas;
  const hasBoth = hasSobras && hasFaltas;

  // Skeleton de loading
  if (loading) {
    return (
      <View style={[styles.section, style]}>
        <View style={styles.header}>
          <View style={[styles.skeletonLine, { width: 140, height: 18 }]} />
          <View style={[styles.skeletonLine, { width: '90%', height: 14, marginTop: 8 }]} />
        </View>
        <View style={[styles.cardsRow, IS_NARROW && styles.cardsColumn]}>
          <View style={[styles.cardSkeleton, { flex: 1 }]} />
          <View style={[styles.cardSkeleton, { flex: 1 }]} />
        </View>
      </View>
    );
  }

  // Estado vazio total: tudo conciliado
  if (!hasAny) {
    return (
      <Animated.View style={[styles.section, style, animateIn && { opacity: animateIn }]}>
        <View style={styles.emptyStateSuccess}>
          <View style={styles.emptyStateIconWrap}>
            <IconSymbol name="checkmark.circle.fill" size={40} color="#10B981" />
          </View>
          <ThemedText type="defaultSemiBold" style={styles.emptyStateSuccessTitle}>
            Tudo conciliado
          </ThemedText>
          <ThemedText style={styles.emptyStateSuccessSubtext}>
            Não há sobras nem faltas. Todas as transações e títulos estão pareados.
          </ThemedText>
        </View>
      </Animated.View>
    );
  }

  const sectionStyle = animateIn
    ? {
        opacity: animateIn as Animated.Value,
        transform: [
          {
            translateY: (animateIn as Animated.Value).interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }
    : {};

  return (
    <Animated.View style={[styles.section, style, sectionStyle]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <IconSymbol name="arrow.left.arrow.right.circle.fill" size={20} color="#00b09b" />
          <ThemedText type="defaultSemiBold" style={styles.title}>
            Sobras e Faltas
          </ThemedText>
        </View>
        <ThemedText style={styles.subtitle}>
          Transações e títulos pendentes de conciliação
        </ThemedText>

        {/* Tabs: acesso rápido quando há ambos */}
        {hasBoth && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sobras' && styles.tabActive]}
              onPress={() => onTabChange(activeTab === 'sobras' ? null : 'sobras')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`Sobras, ${summary.sobras.count} itens`}
              accessibilityState={{ selected: activeTab === 'sobras' }}>
              <Text style={[styles.tabText, activeTab === 'sobras' && styles.tabTextActive]}>
                Sobras ({summary.sobras.count})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'faltas' && styles.tabActiveFaltas]}
              onPress={() => onTabChange(activeTab === 'faltas' ? null : 'faltas')}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityLabel={`Faltas, ${summary.faltas.count} itens`}
              accessibilityState={{ selected: activeTab === 'faltas' }}>
              <Text style={[styles.tabText, activeTab === 'faltas' && styles.tabTextActiveFaltas]}>
                Faltas ({summary.faltas.count})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={[styles.cardsRow, IS_NARROW && styles.cardsColumn]}>
        {/* Card Sobras */}
        <GlassContainer
          style={StyleSheet.flatten([
            styles.card,
            styles.cardSobras,
            activeTab === 'faltas' && hasBoth ? styles.cardDimmed : undefined,
          ])}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.cardIconSobras]}>
              <IconSymbol name="building.columns.fill" size={22} color="#10B981" />
            </View>
            <View style={styles.cardLabelWrap}>
              <ThemedText type="defaultSemiBold" style={styles.cardLabel}>
                Sobras
              </ThemedText>
              <ThemedText style={styles.cardDesc}>
                Extrato sem título no ERP
              </ThemedText>
            </View>
          </View>
          <View style={styles.cardStats}>
            <View style={[styles.badge, styles.badgeSobras]}>
              <Text style={styles.badgeTextSobras}>
                {summary.sobras.count} {summary.sobras.count === 1 ? 'item' : 'itens'}
              </Text>
            </View>
            <Text
              style={[
                styles.total,
                { color: summary.sobras.total >= 0 ? '#10B981' : '#EF4444' },
              ]}>
              {formatCurrency(Math.abs(summary.sobras.total))}
              {summary.sobras.total < 0 && ' (-)'}
            </Text>
          </View>

          {hasSobras ? (
            <>
              <View style={styles.previewList}>
                {summary.sobras.items.slice(0, PREVIEW_LIMIT).map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.previewItem, idx === 0 && styles.previewItemFirst]}
                    onPress={() => {
                      onSelectTransaction(item.id!);
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={`${item.descricao || 'Transação'}, ${formatCurrency(item.valor)}, ${formatDate(item.data)}`}
                    accessibilityHint="Toque para selecionar e conciliar">
                    <View style={styles.previewItemContent}>
                      <ThemedText style={styles.previewItemDesc} numberOfLines={1}>
                        {item.descricao?.trim() || 'Sem descrição'}
                      </ThemedText>
                      <View style={styles.previewItemRow}>
                        <Text style={styles.previewItemDate}>{formatDate(item.data)}</Text>
                        <Text
                          style={[
                            styles.previewItemValor,
                            { color: item.tipo === 'receita' ? '#10B981' : '#EF4444' },
                          ]}>
                          {item.tipo === 'receita' ? '+' : '-'}
                          {formatCurrency(item.valor)}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ))}
              </View>
              {summary.sobras.items.length > PREVIEW_LIMIT && (
                <TouchableOpacity
                  style={styles.verTodosBtn}
                  onPress={() => onViewFullList('sobras')}
                  activeOpacity={0.7}
                  accessibilityLabel={`Ver lista completa de sobras, ${summary.sobras.items.length} itens`}>
                  <ThemedText style={styles.verTodosText}>Ver lista completa</ThemedText>
                  <IconSymbol name="chevron.right" size={14} color="#10B981" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol name="checkmark.circle.fill" size={28} color="rgba(16, 185, 129, 0.5)" />
              <ThemedText style={styles.emptyCardText}>Nenhuma sobra</ThemedText>
              <ThemedText style={styles.emptyCardSubtext}>
                Transações pareadas com títulos
              </ThemedText>
            </View>
          )}
        </GlassContainer>

        {/* Card Faltas */}
        <GlassContainer
          style={StyleSheet.flatten([
            styles.card,
            styles.cardFaltas,
            activeTab === 'sobras' && hasBoth ? styles.cardDimmed : undefined,
          ])}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, styles.cardIconFaltas]}>
              <IconSymbol name="doc.text.fill" size={22} color="#6366F1" />
            </View>
            <View style={styles.cardLabelWrap}>
              <ThemedText type="defaultSemiBold" style={styles.cardLabel}>
                Faltas
              </ThemedText>
              <ThemedText style={styles.cardDesc}>
                ERP sem transação no extrato
              </ThemedText>
            </View>
          </View>
          <View style={styles.cardStats}>
            <View style={[styles.badge, styles.badgeFaltas]}>
              <Text style={styles.badgeTextFaltas}>
                {summary.faltas.count} {summary.faltas.count === 1 ? 'item' : 'itens'}
              </Text>
            </View>
            <Text
              style={[
                styles.total,
                { color: summary.faltas.total >= 0 ? '#10B981' : '#EF4444' },
              ]}>
              {formatCurrency(Math.abs(summary.faltas.total))}
              {summary.faltas.total < 0 && ' (-)'}
            </Text>
          </View>

          {hasFaltas ? (
            <>
              <View style={styles.previewList}>
                {summary.faltas.items.slice(0, PREVIEW_LIMIT).map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.previewItem, idx === 0 && styles.previewItemFirst]}
                    onPress={() => {
                      onSelectTitle(item.id!);
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel={`${item.fornecedor_cliente || item.descricao || 'Título'}, ${formatCurrency(item.valor)}, vencimento ${formatDate(item.data_vencimento)}`}
                    accessibilityHint="Toque para selecionar e conciliar">
                    <View style={styles.previewItemContent}>
                      <ThemedText style={styles.previewItemDesc} numberOfLines={1}>
                        {item.fornecedor_cliente?.trim() || item.descricao?.trim() || 'Sem identificação'}
                      </ThemedText>
                      <View style={styles.previewItemRow}>
                        <Text style={styles.previewItemDate}>
                          Venc. {formatDate(item.data_vencimento)}
                        </Text>
                        <Text
                          style={[
                            styles.previewItemValor,
                            { color: item.tipo === 'receber' ? '#10B981' : '#EF4444' },
                          ]}>
                          {item.tipo === 'receber' ? '+' : '-'}
                          {formatCurrency(item.valor)}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol name="chevron.right" size={14} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ))}
              </View>
              {summary.faltas.items.length > PREVIEW_LIMIT && (
                <TouchableOpacity
                  style={[styles.verTodosBtn, styles.verTodosBtnFaltas]}
                  onPress={() => onViewFullList('faltas')}
                  activeOpacity={0.7}
                  accessibilityLabel={`Ver lista completa de faltas, ${summary.faltas.items.length} itens`}>
                  <ThemedText style={styles.verTodosTextFaltas}>Ver lista completa</ThemedText>
                  <IconSymbol name="chevron.right" size={14} color="#6366F1" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <IconSymbol name="checkmark.circle.fill" size={28} color="rgba(99, 102, 241, 0.5)" />
              <ThemedText style={styles.emptyCardText}>Nenhuma falta</ThemedText>
              <ThemedText style={styles.emptyCardSubtext}>
                Títulos pareados com transações
              </ThemedText>
            </View>
          )}
        </GlassContainer>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 17,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  tabActiveFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabTextActive: {
    color: '#10B981',
  },
  tabTextActiveFaltas: {
    color: '#6366F1',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  cardsColumn: {
    flexDirection: 'column',
  },
  card: {
    flex: 1,
    minWidth: IS_NARROW ? undefined : 150,
    padding: 16,
    minHeight: 200,
    borderLeftWidth: 4,
  },
  cardSobras: {
    borderLeftColor: '#10B981',
  },
  cardFaltas: {
    borderLeftColor: '#6366F1',
  },
  cardDimmed: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardIconSobras: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  cardIconFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  cardLabelWrap: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'nowrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexShrink: 0,
  },
  badgeSobras: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeFaltas: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  badgeTextSobras: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  badgeTextFaltas: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  total: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  previewList: {
    maxHeight: 140,
    marginTop: 4,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  previewItemFirst: {
    borderTopWidth: 0,
    paddingTop: 0,
  },
  previewItemContent: {
    flex: 1,
  },
  previewItemDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  previewItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewItemDate: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  previewItemValor: {
    fontSize: 12,
    fontWeight: '600',
  },
  verTodosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  verTodosText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  verTodosBtnFaltas: {
    borderTopColor: 'rgba(99, 102, 241, 0.2)',
  },
  verTodosTextFaltas: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
  },
  emptyCardSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyStateSuccess: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  emptyStateIconWrap: {
    marginBottom: 12,
  },
  emptyStateSuccessTitle: {
    fontSize: 17,
    color: '#10B981',
    marginBottom: 6,
  },
  emptyStateSuccessSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  skeletonLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
  },
  cardSkeleton: {
    minHeight: 180,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
});
