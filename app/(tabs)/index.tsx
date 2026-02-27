import { AnimatedBackground } from '@/components/animated-background';
import { CSVImportModal } from '@/components/csv-import-modal';
import { GlassContainer } from '@/components/glass-container';
import { NewTransactionModal } from '@/components/new-transaction-modal';
import { ReportsModal } from '@/components/reports-modal';
import { ReconciliationModal } from '@/components/reconciliation-modal';
import { ReconciliationHistoryModal } from '@/components/reconciliation-history-modal';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { useNotification } from '@/hooks/use-notification';
import { buscarTransacoes, type TransactionWithAccount } from '@/lib/services/transactions';
import { buscarTitulos, type TitleWithAccount } from '@/lib/services/titles';
import { formatCurrency } from '@/lib/utils/currency';
import { generateReconciliationReport as getReconciliationReportData, type ReconciliationReportData } from '@/lib/services/reports';
import { generateReconciliationReport, shareReconciliationReport } from '@/lib/services/reconciliation-export';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, Animated, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type PeriodType = 'today' | 'week' | 'month' | 'year';

// Funções auxiliares para calcular períodos
const getPeriodDates = (period: PeriodType): { start: Date; end: Date } => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
  }
  
  return { start, end };
};

const getPreviousPeriodDates = (period: PeriodType): { start: Date; end: Date } => {
  const { start: currentStart, end: currentEnd } = getPeriodDates(period);
  const duration = currentEnd.getTime() - currentStart.getTime();
  const end = new Date(currentStart.getTime() - 1);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - duration);
  start.setHours(0, 0, 0, 0);
  
  return { start, end };
};

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [csvImportVisible, setCsvImportVisible] = React.useState(false);
  const [reportsVisible, setReportsVisible] = React.useState(false);
  const [newTransactionVisible, setNewTransactionVisible] = React.useState(false);
  const [reconciliationVisible, setReconciliationVisible] = React.useState(false);
  const [reconciliationHistoryVisible, setReconciliationHistoryVisible] = React.useState(false);
  const [exportingReport, setExportingReport] = React.useState(false);
  const [transactions, setTransactions] = React.useState<TransactionWithAccount[]>([]);
  const [allTransactions, setAllTransactions] = React.useState<TransactionWithAccount[]>([]); // Todas as transações (sem filtro)
  const [titles, setTitles] = React.useState<TitleWithAccount[]>([]);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'today' | 'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = React.useState(true);
  const [reconciliationSummary, setReconciliationSummary] = React.useState<ReconciliationReportData | null>(null);
  const [reconciliationSummaryLoading, setReconciliationSummaryLoading] = React.useState(false);
  const [reconciliationSummaryError, setReconciliationSummaryError] = React.useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { selectedCompany } = useCompany();
  const { showSuccess, showError, showInfo } = useNotification();

  // Animações
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  // CRÍTICO: Inicializar com 0 para evitar erro no Android/Fabric
  // O valor inicial numérico pode causar problemas quando renderizado antes da animação
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const balanceCardAnim = React.useRef(new Animated.Value(0)).current;
  const incomeCardAnim = React.useRef(new Animated.Value(0)).current;
  const expenseCardAnim = React.useRef(new Animated.Value(0)).current;
  const transactionsAnim = React.useRef(new Animated.Value(0)).current;
  const actionsAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim3 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim4 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim5 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim6 = React.useRef(new Animated.Value(1)).current;
  const reconciliationAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    let animations: Animated.CompositeAnimation | null = null;
    const isMountedRef = { current: true };
    let animationTimeout: any = null;

    // Função segura para resetar valores sem causar erros de imutabilidade
    const safeResetValue = (anim: Animated.Value, initialValue: number) => {
      try {
        if (isMountedRef.current) {
          anim.setValue(initialValue);
        }
      } catch (error) {
        // Ignorar erros de imutabilidade durante cleanup
        console.warn('Erro ao resetar valor de animação (pode ser ignorado durante cleanup):', error);
      }
    };

    // Parar animação anterior de forma segura
    const stopPreviousAnimation = () => {
      try {
        if (animations) {
          animations.stop();
          animations = null;
        }
      } catch (error) {
        // Ignorar erros ao parar animação anterior
      }
    };

    // Parar animação anterior
    stopPreviousAnimation();

    // Resetar todos os valores de forma segura (sem callbacks que podem causar problemas)
    safeResetValue(fadeAnim, 0);
    // CRÍTICO: slideAnim deve começar com 0 para evitar erro no Android/Fabric
    // Será resetado para 30 apenas dentro do timeout, antes de iniciar a animação
    safeResetValue(slideAnim, 0);
    safeResetValue(balanceCardAnim, 0);
    safeResetValue(incomeCardAnim, 0);
    safeResetValue(expenseCardAnim, 0);
    safeResetValue(transactionsAnim, 0);
    safeResetValue(actionsAnim, 0);
    safeResetValue(reconciliationAnim, 0);

    // Delay maior no Android para garantir estabilidade
    animationTimeout = setTimeout(() => {
      if (!isMountedRef.current) return;

      try {
        // Resetar slideAnim para 30 apenas agora, antes de iniciar a animação
        // Isso garante que o componente já foi renderizado com valor inicial 0
        safeResetValue(slideAnim, 30);
        
        // Animação de entrada escalonada
        animations = Animated.parallel([
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
          Animated.timing(reconciliationAnim, {
            toValue: 1,
            duration: 500,
            delay: 450,
            useNativeDriver: true,
          }),
        ]);

        // Não usar callback no start() para evitar problemas com propriedades somente leitura
        animations.start();
      } catch (error) {
        console.warn('Erro ao iniciar animação:', error);
      }
    }, Platform.OS === 'android' ? 100 : 16); // Delay maior no Android para garantir estabilidade

    // Cleanup: parar animações ao desmontar
    return () => {
      isMountedRef.current = false;

      // Limpar timeout se ainda não executou
      if (animationTimeout) {
        clearTimeout(animationTimeout);
        animationTimeout = null;
      }

      // Parar animação de forma segura
      try {
        if (animations) {
          animations.stop();
          animations = null;
        }
      } catch (error) {
        // Ignorar erros durante cleanup
      }

      // Não chamar stopAnimation() durante cleanup - pode causar erros de imutabilidade
      // As animações serão limpas automaticamente quando o componente for desmontado
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carregar transações e títulos do Supabase
  const loadTransactions = React.useCallback(async () => {
    if (!userId) {
      setLoading(false);
      setTransactions([]);
      setAllTransactions([]);
      setTitles([]);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar transações e títulos em paralelo, filtrando pela empresa selecionada (se houver)
      const empresaId = selectedCompany?.id ?? null;
      const [transactionsResult, titlesResult] = await Promise.all([
        buscarTransacoes(userId, empresaId),
        buscarTitulos(userId, empresaId),
      ]);
      
      if (transactionsResult.error) {
        console.error('Erro ao carregar transações:', transactionsResult.error);
        showError('Não foi possível carregar os dados financeiros.');
        setTransactions([]);
        setAllTransactions([]);
      } else {
        const allData = transactionsResult.data || [];
        setAllTransactions(allData);
      }
      
      if (titlesResult.error) {
        console.error('Erro ao carregar títulos:', titlesResult.error);
        setTitles([]);
      } else {
        setTitles(titlesResult.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showError('Erro ao carregar dados financeiros.');
      setTransactions([]);
      setAllTransactions([]);
      setTitles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Período atual em formato ISO para o relatório de conciliação
  const periodDates = useMemo(() => {
    const { start, end } = getPeriodDates(selectedPeriod);
    return {
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
    };
  }, [selectedPeriod]);

  // Carregar resumo de conciliação do período
  useEffect(() => {
    if (!userId) {
      setReconciliationSummary(null);
      setReconciliationSummaryError(null);
      return;
    }
    let cancelled = false;
    setReconciliationSummaryLoading(true);
    setReconciliationSummaryError(null);
    getReconciliationReportData(userId, periodDates.startStr, periodDates.endStr)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setReconciliationSummaryError(error?.message ?? 'Erro ao carregar conciliação');
          setReconciliationSummary(null);
          return;
        }
        setReconciliationSummary(data ?? null);
      })
      .catch((err) => {
        if (!cancelled) {
          setReconciliationSummaryError(err?.message ?? 'Erro ao carregar conciliação');
          setReconciliationSummary(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReconciliationSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, periodDates.startStr, periodDates.endStr]);

  // Filtrar transações por período selecionado
  const filteredTransactions = useMemo(() => {
    const { start, end } = getPeriodDates(selectedPeriod);
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.data + 'T00:00:00');
      return transactionDate >= start && transactionDate <= end;
    });
  }, [allTransactions, selectedPeriod]);

  // Transações do período anterior para comparação
  const previousPeriodTransactions = useMemo(() => {
    const { start, end } = getPreviousPeriodDates(selectedPeriod);
    return allTransactions.filter((t) => {
      const transactionDate = new Date(t.data + 'T00:00:00');
      return transactionDate >= start && transactionDate <= end;
    });
  }, [allTransactions, selectedPeriod]);

  // Atualizar transações filtradas quando período mudar
  useEffect(() => {
    setTransactions(filteredTransactions);
  }, [filteredTransactions]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadTransactions();
  }, [loadTransactions]);

  // Animações de press para botões
  const scaleAnim1 = React.useRef(new Animated.Value(1)).current;
  const scaleAnim2 = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn1 = () => {
    scaleAnim1.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim1, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut1 = () => {
    scaleAnim1.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim1, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressIn2 = () => {
    scaleAnim2.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim2, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut2 = () => {
    scaleAnim2.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim2, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressIn3 = () => {
    scaleAnim3.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim3, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut3 = () => {
    scaleAnim3.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim3, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressIn4 = () => {
    scaleAnim4.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim4, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut4 = () => {
    scaleAnim4.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim4, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressIn5 = () => {
    scaleAnim5.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim5, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut5 = () => {
    scaleAnim5.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim5, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressIn6 = () => {
    scaleAnim6.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim6, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      anim.start();
    });
  };
  const handlePressOut6 = () => {
    scaleAnim6.stopAnimation(() => {
      const anim = Animated.spring(scaleAnim6, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      });
      anim.start();
    });
  };

  const handleExportReport = async () => {
    if (!userId) return;

    Alert.alert(
      'Exportar Relatório',
      'Escolha o formato:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'CSV',
          onPress: async () => {
            try {
              setExportingReport(true);
              const report = await generateReconciliationReport(userId);
              await shareReconciliationReport(report, 'csv');
              showSuccess('Relatório exportado com sucesso!', {
                iconType: 'export',
              });
            } catch (error: any) {
              showError(error.message || 'Não foi possível exportar o relatório');
            } finally {
              setExportingReport(false);
            }
          },
        },
      ]
    );
  };

  // Calcular dados financeiros do período atual
  const financialData = useMemo(() => {
    const income = filteredTransactions
      .filter((t: TransactionWithAccount) => t.tipo === 'receita')
      .reduce((sum: number, t: TransactionWithAccount) => sum + Number(t.valor), 0);
    
    const expense = filteredTransactions
      .filter((t: TransactionWithAccount) => t.tipo === 'despesa')
      .reduce((sum: number, t: TransactionWithAccount) => sum + Number(t.valor), 0);
    
    const balance = income - expense;
    
    return {
      balance,
      income,
      expense,
      balanceFormatted: formatCurrency(balance),
      incomeFormatted: formatCurrency(income),
      expenseFormatted: formatCurrency(expense),
    };
  }, [filteredTransactions]);

  // Calcular dados do período anterior para comparação
  const previousFinancialData = useMemo(() => {
    const income = previousPeriodTransactions
      .filter((t: TransactionWithAccount) => t.tipo === 'receita')
      .reduce((sum: number, t: TransactionWithAccount) => sum + Number(t.valor), 0);
    
    const expense = previousPeriodTransactions
      .filter((t: TransactionWithAccount) => t.tipo === 'despesa')
      .reduce((sum: number, t: TransactionWithAccount) => sum + Number(t.valor), 0);
    
    const balance = income - expense;
    
    return { balance, income, expense };
  }, [previousPeriodTransactions]);

  // Calcular comparação percentual
  const comparison = useMemo(() => {
    const calculateChange = (current: number, previous: number): { value: number; percentage: number; isPositive: boolean } => {
      if (previous === 0) {
        return { value: current, percentage: current > 0 ? 100 : 0, isPositive: current >= 0 };
      }
      const change = current - previous;
      const percentage = (change / Math.abs(previous)) * 100;
      return { value: change, percentage: Math.abs(percentage), isPositive: change >= 0 };
    };

    return {
      balance: calculateChange(financialData.balance, previousFinancialData.balance),
      income: calculateChange(financialData.income, previousFinancialData.income),
      expense: calculateChange(financialData.expense, previousFinancialData.expense),
    };
  }, [financialData, previousFinancialData]);

  // Animações para cada item de transação (fixo: 4 refs)
  const transactionAnim1 = React.useRef(new Animated.Value(0)).current;
  const transactionAnim2 = React.useRef(new Animated.Value(0)).current;
  const transactionAnim3 = React.useRef(new Animated.Value(0)).current;
  const transactionAnim4 = React.useRef(new Animated.Value(0)).current;
  const transactionAnims = [transactionAnim1, transactionAnim2, transactionAnim3, transactionAnim4];

  // Calcular alertas
  const alerts = useMemo(() => {
    const alertsList: Array<{ type: 'warning' | 'error' | 'info'; message: string; action?: () => void }> = [];
    
    // Títulos vencendo nos próximos 7 dias
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const em7Dias = new Date(hoje);
    em7Dias.setDate(em7Dias.getDate() + 7);
    
    const titulosVencendo = titles.filter((t) => {
      if (t.status === 'pago') return false;
      const vencimento = new Date(t.data_vencimento);
      vencimento.setHours(0, 0, 0, 0);
      return vencimento >= hoje && vencimento <= em7Dias;
    });
    
    if (titulosVencendo.length > 0) {
      const totalVencendo = titulosVencendo.reduce((sum, t) => sum + Number(t.valor), 0);
      alertsList.push({
        type: 'warning',
        message: `${titulosVencendo.length} título${titulosVencendo.length > 1 ? 's' : ''} vencendo em até 7 dias (${formatCurrency(totalVencendo)})`,
        action: () => router.push('/(tabs)/titles'),
      });
    }
    
    // Títulos vencidos
    const titulosVencidos = titles.filter((t) => t.status === 'vencido');
    if (titulosVencidos.length > 0) {
      const totalVencido = titulosVencidos.reduce((sum, t) => sum + Number(t.valor), 0);
      alertsList.push({
        type: 'error',
        message: `${titulosVencidos.length} título${titulosVencidos.length > 1 ? 's' : ''} vencido${titulosVencidos.length > 1 ? 's' : ''} (${formatCurrency(totalVencido)})`,
        action: () => router.push('/(tabs)/titles'),
      });
    }
    
    // Saldo baixo (menor que 10% das receitas do mês ou negativo)
    const receitasMes = financialData.income;
    const saldoAtual = financialData.balance;
    const thresholdSaldoBaixo = receitasMes * 0.1; // 10% das receitas
    
    if (saldoAtual < 0) {
      alertsList.push({
        type: 'error',
        message: `Saldo negativo! ${formatCurrency(Math.abs(saldoAtual))}`,
      });
    } else if (saldoAtual < thresholdSaldoBaixo && receitasMes > 0) {
      alertsList.push({
        type: 'warning',
        message: `Saldo baixo: ${formatCurrency(saldoAtual)} (menor que 10% das receitas)`,
      });
    }
    
    return alertsList;
  }, [titles, financialData]);

  // Resumo por categoria
  const categorySummary = useMemo(() => {
    const categoryMap = new Map<string, { income: number; expense: number }>();
    
    filteredTransactions.forEach((t) => {
      const current = categoryMap.get(t.categoria) || { income: 0, expense: 0 };
      if (t.tipo === 'receita') {
        current.income += Number(t.valor);
      } else {
        current.expense += Number(t.valor);
      }
      categoryMap.set(t.categoria, current);
    });
    
    // Top 5 despesas por categoria
    const topExpenses = Array.from(categoryMap.entries())
      .map(([categoria, data]) => ({
        categoria,
        valor: data.expense,
        tipo: 'expense' as const,
      }))
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    
    // Top 5 receitas por categoria
    const topIncomes = Array.from(categoryMap.entries())
      .map(([categoria, data]) => ({
        categoria,
        valor: data.income,
        tipo: 'income' as const,
      }))
      .filter((item) => item.valor > 0)
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
    
    return { topExpenses, topIncomes };
  }, [filteredTransactions]);

  // Transações recentes (últimas 4)
  const recentTransactions = useMemo(() => {
    return transactions
      .slice(0, 4)
      .map((transaction: TransactionWithAccount) => {
        const tipo = transaction.tipo === 'receita' ? 'income' : 'expense';
        const amount = tipo === 'income' 
          ? `+${formatCurrency(transaction.valor)}`
          : `-${formatCurrency(transaction.valor)}`;
        
        // Formatar data
        const date = new Date(transaction.data + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let dateStr = '';
        if (date.toDateString() === today.toDateString()) {
          dateStr = 'Hoje';
        } else if (date.toDateString() === yesterday.toDateString()) {
          dateStr = 'Ontem';
        } else {
          dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        }
        
        return {
          id: transaction.id?.toString() || '',
          description: transaction.descricao,
          amount,
          date: dateStr,
          type: tipo,
        };
      });
  }, [transactions]);

  React.useEffect(() => {
    // Animar cada item de transação com delay escalonado
    const animations: Animated.CompositeAnimation[] = [];
    
    transactionAnims.forEach((anim: Animated.Value, index: number) => {
      if (index < recentTransactions.length) {
        anim.stopAnimation(() => {
          anim.setValue(0);
          const timingAnim = Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            delay: 450 + (index * 50),
            useNativeDriver: true,
          });
          animations.push(timingAnim);
          timingAnim.start();
        });
      }
    });

    // Cleanup
    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [recentTransactions.length]);

  if (loading && transactions.length === 0) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 16 }]}>
          <ActivityIndicator size="large" color="#00b09b" />
          <ThemedText style={styles.loadingText}>Carregando dados...</ThemedText>
        </View>
      </View>
    );
  }

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
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <ScreenHeader
            title={`Olá, ${selectedCompany?.nome_fantasia || selectedCompany?.razao_social || 'Empresa'}`}
            subtitle="Resumo financeiro"
            showCompanySelector={true}
          />
          
          {/* Filtro de Período */}
          <View style={styles.periodSelector}>
            {(['today', 'week', 'month', 'year'] as PeriodType[]).map((period) => {
              const labels: Record<PeriodType, string> = {
                today: 'Hoje',
                week: 'Semana',
                month: 'Mês',
                year: 'Ano',
              };
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodButton, isSelected && styles.periodButtonActive]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.7}>
                  <Text style={[styles.periodButtonText, isSelected && styles.periodButtonTextActive]}>
                    {labels[period]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              {financialData.balanceFormatted}
            </Text>
            {comparison.balance.percentage > 0 && (
              <View style={styles.balanceTrend}>
                <IconSymbol 
                  name={comparison.balance.isPositive ? "arrow.up.right" : "arrow.down.right"} 
                  size={14} 
                  color={comparison.balance.isPositive ? "#10B981" : "#EF4444"} 
                />
                <Text style={[
                  styles.balanceTrendText,
                  { color: comparison.balance.isPositive ? "#10B981" : "#EF4444" }
                ]}>
                  {comparison.balance.isPositive ? '+' : '-'}{comparison.balance.percentage.toFixed(1)}%
                </Text>
              </View>
            )}
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
                {financialData.incomeFormatted}
              </Text>
              {comparison.income.percentage > 0 && (
                <View style={styles.squareTrend}>
                  <IconSymbol 
                    name={comparison.income.isPositive ? "arrow.up.right" : "arrow.down.right"} 
                    size={12} 
                    color={comparison.income.isPositive ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.squareTrendText,
                    { color: comparison.income.isPositive ? "#10B981" : "#EF4444" }
                  ]}>
                    {comparison.income.isPositive ? '+' : '-'}{comparison.income.percentage.toFixed(1)}%
                  </Text>
                </View>
              )}
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
                {financialData.expenseFormatted}
              </Text>
              {comparison.expense.percentage > 0 && (
                <View style={styles.squareTrend}>
                  <IconSymbol 
                    name={comparison.expense.isPositive ? "arrow.up.right" : "arrow.down.right"} 
                    size={12} 
                    color={comparison.expense.isPositive ? "#10B981" : "#EF4444"} 
                  />
                  <Text style={[
                    styles.squareTrendText,
                    { color: comparison.expense.isPositive ? "#10B981" : "#EF4444" }
                  ]}>
                    {comparison.expense.isPositive ? '+' : '-'}{comparison.expense.percentage.toFixed(1)}%
                  </Text>
                </View>
              )}
            </GlassContainer>
            </Animated.View>
          </View>
        </View>

        {/* Alertas */}
        {alerts.length > 0 && (
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
              <ThemedText type="subtitle" style={styles.sectionTitle}>Alertas</ThemedText>
            </View>
            <GlassContainer style={styles.alertsCard}>
              {alerts.map((alert, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertItem,
                    index < alerts.length - 1 && styles.alertItemBorder,
                    alert.type === 'error' && styles.alertItemError,
                    alert.type === 'warning' && styles.alertItemWarning,
                  ]}
                  onPress={alert.action}
                  activeOpacity={alert.action ? 0.7 : 1}>
                  <View style={styles.alertContent}>
                    <IconSymbol
                      name={alert.type === 'error' ? 'exclamationmark.triangle.fill' : 'exclamationmark.circle.fill'}
                      size={20}
                      color={alert.type === 'error' ? '#EF4444' : '#FBBF24'}
                    />
                    <Text style={styles.alertText}>{alert.message}</Text>
                  </View>
                  {alert.action && (
                    <IconSymbol name="chevron.right" size={16} color="rgba(255, 255, 255, 0.5)" />
                  )}
                </TouchableOpacity>
              ))}
            </GlassContainer>
          </Animated.View>
        )}

        {/* Resumo por Categoria */}
        {(categorySummary.topExpenses.length > 0 || categorySummary.topIncomes.length > 0) && (
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
              <ThemedText type="subtitle" style={styles.sectionTitle}>Resumo por Categoria</ThemedText>
            </View>
            <View style={styles.categoryRow}>
              {categorySummary.topExpenses.length > 0 && (
                <GlassContainer style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <IconSymbol name="arrow.up.circle.fill" size={18} color="#EF4444" />
                    <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>Top Despesas</ThemedText>
                  </View>
                  {categorySummary.topExpenses.map((item, index) => (
                    <View key={item.categoria} style={styles.categoryItem}>
                      <View style={styles.categoryItemTopRow}>
                        <View style={[styles.categoryRank, { backgroundColor: '#EF444420' }]}>
                          <Text style={[styles.categoryRankText, { color: '#EF4444' }]}>{index + 1}</Text>
                        </View>
                        <ThemedText style={styles.categoryName}>
                          {item.categoria}
                        </ThemedText>
                      </View>
                      <Text style={[styles.categoryValue, { color: '#EF4444' }]}>
                        {formatCurrency(item.valor)}
                      </Text>
                    </View>
                  ))}
                </GlassContainer>
              )}
              {categorySummary.topIncomes.length > 0 && (
                <GlassContainer style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <IconSymbol name="arrow.down.circle.fill" size={18} color="#10B981" />
                    <ThemedText type="defaultSemiBold" style={styles.categoryTitle}>Top Receitas</ThemedText>
                  </View>
                  {categorySummary.topIncomes.map((item, index) => (
                    <View key={item.categoria} style={styles.categoryItem}>
                      <View style={styles.categoryItemTopRow}>
                        <View style={[styles.categoryRank, { backgroundColor: '#10B98120' }]}>
                          <Text style={[styles.categoryRankText, { color: '#10B981' }]}>{index + 1}</Text>
                        </View>
                        <ThemedText style={styles.categoryName}>
                          {item.categoria}
                        </ThemedText>
                      </View>
                      <Text style={[styles.categoryValue, { color: '#10B981' }]}>
                        {formatCurrency(item.valor)}
                      </Text>
                    </View>
                  ))}
                </GlassContainer>
              )}
            </View>
          </Animated.View>
        )}

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
            {recentTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <ThemedText style={styles.emptyTransactionsText}>
                  Nenhuma transação recente
                </ThemedText>
                <ThemedText style={styles.emptyTransactionsSubtext}>
                  Crie uma nova transação para começar
                </ThemedText>
              </View>
            ) : (
              recentTransactions.map((transaction: any, index: number) => (
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
              ))
            )}
          </GlassContainer>
        </Animated.View>

        {/* Conciliação Bancária */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: reconciliationAnim,
              transform: [
                {
                  translateY: reconciliationAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Conciliação Bancária
            </ThemedText>
          </View>

          {/* Cards de resumo da conciliação (período selecionado) */}
          {reconciliationSummaryLoading && (
            <View style={styles.reconciliationStatsRow}>
              <GlassContainer style={styles.reconciliationStatCardSkeleton}>
                <ActivityIndicator size="small" color="#00b09b" />
                <ThemedText style={styles.reconciliationStatSkeletonText}>Carregando...</ThemedText>
              </GlassContainer>
            </View>
          )}
          {!reconciliationSummaryLoading && reconciliationSummaryError && (
            <View style={styles.reconciliationStatsRow}>
              <GlassContainer style={styles.reconciliationStatCardError}>
                <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#F59E0B" />
                <ThemedText style={styles.reconciliationStatErrorText} numberOfLines={2}>
                  {reconciliationSummaryError}
                </ThemedText>
              </GlassContainer>
            </View>
          )}
          {!reconciliationSummaryLoading && reconciliationSummary && (
            <View style={styles.reconciliationStatsGrid}>
              <GlassContainer style={styles.reconciliationStatCard}>
                <View style={[styles.reconciliationStatIconWrap, { backgroundColor: '#00b09b20' }]}>
                  <IconSymbol name="percent" size={20} color="#00b09b" />
                </View>
                <ThemedText style={styles.reconciliationStatLabel}>Taxa</ThemedText>
                <Text style={styles.reconciliationStatValue}>
                  {reconciliationSummary.taxaConciliacao.toFixed(0)}%
                </Text>
              </GlassContainer>
              <GlassContainer style={styles.reconciliationStatCard}>
                <View style={[styles.reconciliationStatIconWrap, { backgroundColor: '#10B98120' }]}>
                  <IconSymbol name="checkmark.circle.fill" size={20} color="#10B981" />
                </View>
                <ThemedText style={styles.reconciliationStatLabel}>Conciliados</ThemedText>
                <Text style={styles.reconciliationStatValue} numberOfLines={1}>
                  {formatCurrency(reconciliationSummary.totalConciliado)}
                </Text>
                <ThemedText style={styles.reconciliationStatSub}>
                  {reconciliationSummary.transacoesConciliadas} trans.
                </ThemedText>
              </GlassContainer>
              <GlassContainer style={styles.reconciliationStatCard}>
                <View style={[styles.reconciliationStatIconWrap, { backgroundColor: '#F59E0B20' }]}>
                  <IconSymbol name="arrow.down.doc.fill" size={20} color="#F59E0B" />
                </View>
                <ThemedText style={styles.reconciliationStatLabel}>Sobras</ThemedText>
                <Text style={styles.reconciliationStatValue} numberOfLines={1}>
                  {formatCurrency(reconciliationSummary.totalSobrasValor)}
                </Text>
                <ThemedText style={styles.reconciliationStatSub}>
                  {reconciliationSummary.sobras.length} itens
                </ThemedText>
              </GlassContainer>
              <GlassContainer style={styles.reconciliationStatCard}>
                <View style={[styles.reconciliationStatIconWrap, { backgroundColor: '#EF444420' }]}>
                  <IconSymbol name="doc.badge.plus" size={20} color="#EF4444" />
                </View>
                <ThemedText style={styles.reconciliationStatLabel}>Faltas</ThemedText>
                <Text style={styles.reconciliationStatValue} numberOfLines={1}>
                  {formatCurrency(reconciliationSummary.totalFaltasValor)}
                </Text>
                <ThemedText style={styles.reconciliationStatSub}>
                  {reconciliationSummary.faltas.length} itens
                </ThemedText>
              </GlassContainer>
            </View>
          )}

          <GlassContainer style={styles.reconciliationCard}>
            <View style={styles.reconciliationContent}>
              <View style={styles.reconciliationIconContainer}>
                <MaterialIcons name="compare-arrows" size={32} color="#00b09b" />
              </View>
              <View style={styles.reconciliationTextContainer}>
                <ThemedText type="defaultSemiBold" style={styles.reconciliationTitle}>
                  Concilie transações bancárias
                </ThemedText>
                <ThemedText style={styles.reconciliationSubtitle}>
                  Match automático por valor, data e descrição
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reconciliationButton}
              onPress={() => {
                if (!reconciliationVisible) {
                  setReconciliationVisible(true);
                  showInfo('Selecione uma transação (Banco) e um título (ERP) para conciliar', {
                    iconType: 'reconciliation',
                    title: 'Conciliação bancária aberta',
                    duration: 3500,
                  });
                }
              }}
              activeOpacity={0.8}>
              <MaterialIcons name="compare-arrows" size={18} color="#FFFFFF" />
              <Text style={styles.reconciliationButtonText}>Iniciar Conciliação</Text>
            </TouchableOpacity>
          </GlassContainer>
          <View style={styles.reconciliationActions}>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim5 }] }}>
              <TouchableOpacity
                style={styles.reconciliationActionButton}
                onPress={() => setReconciliationHistoryVisible(true)}
                onPressIn={handlePressIn5}
                onPressOut={handlePressOut5}
                activeOpacity={0.8}>
                <IconSymbol name="clock.arrow.circlepath" size={18} color="#00b09b" />
                <Text style={styles.reconciliationActionText}>Histórico</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ flex: 1, transform: [{ scale: scaleAnim6 }] }}>
              <TouchableOpacity
                style={styles.reconciliationActionButton}
                onPress={handleExportReport}
                onPressIn={handlePressIn6}
                onPressOut={handlePressOut6}
                disabled={exportingReport}
                activeOpacity={0.8}>
                {exportingReport ? (
                  <ActivityIndicator size="small" color="#00b09b" />
                ) : (
                  <IconSymbol name="square.and.arrow.up" size={18} color="#00b09b" />
                )}
                <Text style={styles.reconciliationActionText}>
                  {exportingReport ? 'Exportando...' : 'Exportar'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
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
          loadTransactions();
        }}
      />
      <ReportsModal
        visible={reportsVisible}
        onClose={() => setReportsVisible(false)}
      />
      <NewTransactionModal
        visible={newTransactionVisible}
        onClose={() => setNewTransactionVisible(false)}
        onSuccess={(transactionType) => {
          // Recarregar dados após criar transação
          onRefresh();
          // Mostrar notificação de sucesso na página com ícone do tipo
          showSuccess('Transação criada com sucesso!', { transactionType });
        }}
        returnToHome={true}
      />
      <ReconciliationModal
        visible={reconciliationVisible}
        onClose={() => setReconciliationVisible(false)}
        onSuccess={() => {
          loadTransactions();
        }}
      />
      <ReconciliationHistoryModal
        visible={reconciliationHistoryVisible}
        onClose={() => setReconciliationHistoryVisible(false)}
        onUpdate={() => {
          loadTransactions();
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
  quickActionsContainer: {
    gap: 12,
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
  emptyTransactions: {
    padding: 32,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  reconciliationStatsRow: {
    marginBottom: 12,
  },
  reconciliationStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  reconciliationStatCard: {
    width: '48%',
    minWidth: 140,
    padding: 12,
    minHeight: 88,
  },
  reconciliationStatIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 2,
  },
  reconciliationStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reconciliationStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reconciliationStatSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  reconciliationStatCardSkeleton: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  reconciliationStatSkeletonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  reconciliationStatCardError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  reconciliationStatErrorText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  reconciliationCard: {
    padding: 16,
    marginBottom: 12,
  },
  reconciliationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  reconciliationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reconciliationTextContainer: {
    flex: 1,
  },
  reconciliationTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reconciliationSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  reconciliationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#00b09b',
  },
  reconciliationButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reconciliationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reconciliationActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 176, 155, 0.3)',
  },
  reconciliationActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00b09b',
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#00b09b',
    borderColor: '#00b09b',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  alertsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  alertItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  alertItemError: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  alertItemWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryItem: {
    flexDirection: 'column',
    paddingVertical: 10,
  },
  categoryItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginBottom: 4,
  },
  categoryRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRankText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryName: {
    flexShrink: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    flexWrap: 'wrap',
  },
  categoryValue: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 34,
    marginTop: 2,
  },
});
