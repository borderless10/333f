import { supabase } from '../supabase';
import { formatCurrency } from '../utils/currency';

/**
 * Tipos de relatórios disponíveis
 */
export type ReportType = 'reconciliation' | 'cashflow';

/**
 * Interface para dados de relatório de conciliação
 */
export interface ReconciliationReportData {
  totalConciliado: number;
  totalNaoConciliado: number;
  taxaConciliacao: number;
  totalTransacoes: number;
  totalTitulos: number;
  transacoesConciliadas: number;
  titulosConciliados: number;
  sobras: Array<{
    id: number;
    descricao: string;
    valor: number;
    data: string;
  }>;
  faltas: Array<{
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
  }>;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Interface para dados de relatório de fluxo de caixa
 */
export interface CashFlowReportData {
  period: {
    start: string;
    end: string;
  };
  daily: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  weekly: Array<{
    week: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  monthly: Array<{
    month: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  totals: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  };
}

/**
 * Gera relatório de conciliação
 */
export async function generateReconciliationReport(
  userId: string,
  startDate: string,
  endDate: string,
  accountId?: number
): Promise<{ data: ReconciliationReportData | null; error: any }> {
  try {
    // Buscar transações no período
    let transacoesQuery = supabase
      .from('transacoes')
      .select('*')
      .eq('codigo_empresa', userId)
      .gte('data', startDate)
      .lte('data', endDate);

    if (accountId) {
      transacoesQuery = transacoesQuery.eq('conta_bancaria_id', accountId);
    }

    const { data: transacoes, error: errorT } = await transacoesQuery;

    if (errorT) {
      return { data: null, error: errorT };
    }

    // Buscar títulos no período
    let titulosQuery = supabase
      .from('titulos')
      .select('*')
      .eq('codigo_empresa', userId)
      .gte('data_vencimento', startDate)
      .lte('data_vencimento', endDate);

    if (accountId) {
      titulosQuery = titulosQuery.eq('conta_bancaria_id', accountId);
    }

    const { data: titulos, error: errorTit } = await titulosQuery;

    if (errorTit) {
      return { data: null, error: errorTit };
    }

    // Buscar conciliações no período
    const { data: reconciliations } = await supabase
      .from('conciliacoes')
      .select('transacao_id, titulo_id, diferenca_valor')
      .in(
        'transacao_id',
        (transacoes || []).map((t) => t.id!).filter(Boolean)
      );

    const reconciledTxIds = new Set(reconciliations?.map((r) => r.transacao_id) || []);
    const reconciledTitleIds = new Set(reconciliations?.map((r) => r.titulo_id) || []);

    const transacoesConciliadas = reconciledTxIds.size;
    const titulosConciliados = reconciledTitleIds.size;

    const totalTransacoes = transacoes?.length || 0;
    const totalTitulos = titulos?.length || 0;

    // Calcular valores conciliados
    const totalConciliado = (reconciliations || []).reduce((sum, r) => {
      const tx = transacoes?.find((t) => t.id === r.transacao_id);
      return sum + (tx?.valor || 0);
    }, 0);

    const totalNaoConciliado =
      (transacoes?.reduce((sum, t) => sum + t.valor, 0) || 0) +
      (titulos?.reduce((sum, t) => sum + t.valor, 0) || 0) -
      totalConciliado * 2; // Multiplicar por 2 porque conta transação e título

    const taxaConciliacao =
      totalTransacoes > 0 ? (transacoesConciliadas / totalTransacoes) * 100 : 0;

    // Sobras: transações sem título correspondente
    const sobras = (transacoes || [])
      .filter((t) => !reconciledTxIds.has(t.id!))
      .map((t) => ({
        id: t.id!,
        descricao: t.descricao,
        valor: t.valor,
        data: t.data,
      }));

    // Faltas: títulos sem transação correspondente
    const faltas = (titulos || [])
      .filter((t) => !reconciledTitleIds.has(t.id!))
      .map((t) => ({
        id: t.id!,
        descricao: t.descricao || t.fornecedor_cliente,
        valor: t.valor,
        data_vencimento: t.data_vencimento,
      }));

    return {
      data: {
        totalConciliado,
        totalNaoConciliado,
        taxaConciliacao,
        totalTransacoes,
        totalTitulos,
        transacoesConciliadas,
        titulosConciliados,
        sobras,
        faltas,
        period: { start: startDate, end: endDate },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Gera relatório de fluxo de caixa
 */
export async function generateCashFlowReport(
  userId: string,
  startDate: string,
  endDate: string,
  accountId?: number
): Promise<{ data: CashFlowReportData | null; error: any }> {
  try {
    // Buscar transações no período
    let query = supabase
      .from('transacoes')
      .select('*')
      .eq('codigo_empresa', userId)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: true });

    if (accountId) {
      query = query.eq('conta_bancaria_id', accountId);
    }

    const { data: transacoes, error } = await query;

    if (error) {
      return { data: null, error };
    }

    // Agrupar por dia
    const dailyMap = new Map<string, { income: number; expense: number }>();

    transacoes?.forEach(transacao => {
      const date = transacao.data;
      const current = dailyMap.get(date) || { income: 0, expense: 0 };

      if (transacao.tipo === 'receita') {
        current.income += transacao.valor;
      } else {
        current.expense += transacao.valor;
      }

      dailyMap.set(date, current);
    });

    // Converter para array e calcular saldo acumulado
    const daily: CashFlowReportData['daily'] = [];
    let balance = 0;

    Array.from(dailyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, values]) => {
        balance += values.income - values.expense;
        daily.push({
          date,
          income: values.income,
          expense: values.expense,
          balance,
        });
      });

    // Agrupar por semana
    const weeklyMap = new Map<string, { income: number; expense: number }>();

    daily.forEach(day => {
      const date = new Date(day.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const current = weeklyMap.get(weekKey) || { income: 0, expense: 0 };
      current.income += day.income;
      current.expense += day.expense;
      weeklyMap.set(weekKey, current);
    });

    const weekly: CashFlowReportData['weekly'] = Array.from(weeklyMap.entries())
      .map(([week, values]) => ({
        week,
        income: values.income,
        expense: values.expense,
        balance: values.income - values.expense,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Agrupar por mês
    const monthlyMap = new Map<string, { income: number; expense: number }>();

    daily.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const current = monthlyMap.get(monthKey) || { income: 0, expense: 0 };
      current.income += day.income;
      current.expense += day.expense;
      monthlyMap.set(monthKey, current);
    });

    const monthly: CashFlowReportData['monthly'] = Array.from(monthlyMap.entries())
      .map(([month, values]) => ({
        month,
        income: values.income,
        expense: values.expense,
        balance: values.income - values.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Totais
    const totalIncome = daily.reduce((sum, day) => sum + day.income, 0);
    const totalExpense = daily.reduce((sum, day) => sum + day.expense, 0);
    const netBalance = totalIncome - totalExpense;

    return {
      data: {
        period: { start: startDate, end: endDate },
        daily,
        weekly,
        monthly,
        totals: {
          totalIncome,
          totalExpense,
          netBalance,
        },
      },
      error: null,
    };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Exporta relatório para CSV
 */
export function exportReportToCSV(
  reportData: ReconciliationReportData | CashFlowReportData,
  type: ReportType
): string {
  if (type === 'reconciliation') {
    const data = reportData as ReconciliationReportData;
    const lines = [
      'Relatório de Conciliação Bancária',
      `Período: ${data.period.start} a ${data.period.end}`,
      '',
      'Resumo',
      `Total Conciliado,${formatCurrency(data.totalConciliado)}`,
      `Total Não Conciliado,${formatCurrency(data.totalNaoConciliado)}`,
      `Taxa de Conciliação,${data.taxaConciliacao.toFixed(2)}%`,
      '',
      'Sobras (Transações sem match)',
      'Descrição,Valor,Data',
      ...data.sobras.map(s => `${s.descricao},${formatCurrency(s.valor)},${s.data}`),
      '',
      'Faltas (Títulos sem match)',
      'Descrição,Valor,Data Vencimento',
      ...data.faltas.map(f => `${f.descricao},${formatCurrency(f.valor)},${f.data_vencimento}`),
    ];
    return lines.join('\n');
  } else {
    const data = reportData as CashFlowReportData;
    const lines = [
      'Relatório de Fluxo de Caixa',
      `Período: ${data.period.start} a ${data.period.end}`,
      '',
      'Resumo',
      `Total Entradas,${formatCurrency(data.totals.totalIncome)}`,
      `Total Saídas,${formatCurrency(data.totals.totalExpense)}`,
      `Saldo Líquido,${formatCurrency(data.totals.netBalance)}`,
      '',
      'Fluxo Diário',
      'Data,Entradas,Saídas,Saldo',
      ...data.daily.map(d => `${d.date},${formatCurrency(d.income)},${formatCurrency(d.expense)},${formatCurrency(d.balance)}`),
    ];
    return lines.join('\n');
  }
}
