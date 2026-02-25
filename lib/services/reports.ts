import { supabase } from '../supabase';
import { formatCurrency } from '../utils/currency';

/**
 * Tipos de relatórios disponíveis
 */
export type ReportType = 'reconciliation' | 'cashflow';

/** Item do relatório: par conciliado (transação ↔ título) */
export interface ConciliadoItem {
  transacao_id: number;
  titulo_id: number;
  descricao_tx: string;
  descricao_titulo: string;
  valor: number;
  data_transacao: string;
  data_vencimento: string;
  data_conciliacao: string;
  status: 'conciliado' | 'conciliado_com_diferenca';
  diferenca_valor?: number;
}

/**
 * Interface para dados de relatório de conciliação (dados reais da tabela conciliacoes)
 */
export interface ReconciliationReportData {
  totalConciliado: number;
  totalNaoConciliado: number;
  totalSobrasValor: number;
  totalFaltasValor: number;
  taxaConciliacao: number;
  totalTransacoes: number;
  totalTitulos: number;
  transacoesConciliadas: number;
  titulosConciliados: number;
  conciliados: ConciliadoItem[];
  sobras: Array<{
    id: number;
    descricao: string;
    valor: number;
    data: string;
    tipo: string;
  }>;
  faltas: Array<{
    id: number;
    descricao: string;
    valor: number;
    data_vencimento: string;
    tipo: string;
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
 * Gera relatório de conciliação com dados reais da tabela conciliacoes
 * Período aplicado às datas das transações e dos títulos
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
      .lte('data', endDate)
      .order('data', { ascending: false });

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
      .lte('data_vencimento', endDate)
      .order('data_vencimento', { ascending: false });

    if (accountId) {
      titulosQuery = titulosQuery.eq('conta_bancaria_id', accountId);
    }

    const { data: titulos, error: errorTit } = await titulosQuery;

    if (errorTit) {
      return { data: null, error: errorTit };
    }

    const txList = transacoes || [];
    const titulosList = titulos || [];
    const txIds = txList.map((t) => t.id!).filter(Boolean);

    // Buscar conciliações do usuário cuja transação está no período
    let reconciliations: Array<{
      transacao_id: number;
      titulo_id: number;
      status: string;
      diferenca_valor: number;
      data_conciliacao: string;
    }> = [];

    if (txIds.length > 0) {
      const { data: recData, error: recError } = await supabase
        .from('conciliacoes')
        .select('transacao_id, titulo_id, status, diferenca_valor, data_conciliacao')
        .eq('usuario_id', userId)
        .in('transacao_id', txIds);

      if (!recError && recData?.length) {
        reconciliations = recData as typeof reconciliations;
      }
    }

    const reconciledTxIds = new Set(reconciliations.map((r) => r.transacao_id));
    const reconciledTitleIds = new Set(reconciliations.map((r) => r.titulo_id));
    const transacoesConciliadas = reconciledTxIds.size;
    const titulosConciliados = reconciledTitleIds.size;
    const totalTransacoes = txList.length;
    const totalTitulos = titulosList.length;

    // Total conciliado: soma dos valores das transações conciliadas
    const totalConciliado = reconciliations.reduce((sum, r) => {
      const tx = txList.find((t) => t.id === r.transacao_id);
      return sum + (tx?.valor ?? 0);
    }, 0);

    // Sobras: transações no período sem título correspondente
    const sobras = txList
      .filter((t) => !reconciledTxIds.has(t.id!))
      .map((t) => ({
        id: t.id!,
        descricao: t.descricao ?? '',
        valor: t.valor,
        data: t.data,
        tipo: t.tipo ?? 'despesa',
      }));

    // Faltas: títulos no período sem transação correspondente
    const faltas = titulosList
      .filter((t) => !reconciledTitleIds.has(t.id!))
      .map((t) => ({
        id: t.id!,
        descricao: (t.descricao || t.fornecedor_cliente) ?? '',
        valor: t.valor,
        data_vencimento: t.data_vencimento,
        tipo: t.tipo ?? 'pagar',
      }));

    const totalSobrasValor = sobras.reduce((s, i) => s + Math.abs(i.valor), 0);
    const totalFaltasValor = faltas.reduce((s, i) => s + Math.abs(i.valor), 0);
    const totalNaoConciliado = totalSobrasValor + totalFaltasValor;

    const taxaConciliacao =
      totalTransacoes > 0 ? (transacoesConciliadas / totalTransacoes) * 100 : 0;

    // Lista de pares conciliados para o relatório
    const conciliados: ConciliadoItem[] = reconciliations.map((r) => {
      const tx = txList.find((t) => t.id === r.transacao_id);
      const tit = titulosList.find((t) => t.id === r.titulo_id);
      return {
        transacao_id: r.transacao_id,
        titulo_id: r.titulo_id,
        descricao_tx: tx?.descricao ?? '—',
        descricao_titulo: (tit?.fornecedor_cliente || tit?.descricao) ?? '—',
        valor: tx?.valor ?? 0,
        data_transacao: tx?.data ?? '',
        data_vencimento: tit?.data_vencimento ?? '',
        data_conciliacao: r.data_conciliacao ?? '',
        status: (r.status as 'conciliado' | 'conciliado_com_diferenca') ?? 'conciliado',
        diferenca_valor: r.diferenca_valor ?? 0,
      };
    });

    return {
      data: {
        totalConciliado,
        totalNaoConciliado,
        totalSobrasValor,
        totalFaltasValor,
        taxaConciliacao,
        totalTransacoes,
        totalTitulos,
        transacoesConciliadas,
        titulosConciliados,
        conciliados,
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
    const formatDt = (s: string) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');
    const lines = [
      'Relatório Conciliado x Não Conciliado',
      `Período: ${data.period.start} a ${data.period.end}`,
      '',
      'Resumo',
      `Total Conciliado,${formatCurrency(data.totalConciliado)}`,
      `Total Não Conciliado (sobras + faltas),${formatCurrency(data.totalNaoConciliado)}`,
      `Sobras (valor),${formatCurrency(data.totalSobrasValor)}`,
      `Faltas (valor),${formatCurrency(data.totalFaltasValor)}`,
      `Taxa de Conciliação,${data.taxaConciliacao.toFixed(2)}%`,
      `Transações conciliadas,${data.transacoesConciliadas}`,
      `Títulos conciliados,${data.titulosConciliados}`,
      '',
      'Conciliados (Transação ↔ Título)',
      'Descrição Transação,Descrição Título,Valor,Data Transação,Data Vencimento,Data Conciliação,Status',
      ...data.conciliados.map(
        c =>
          `"${(c.descricao_tx || '').replace(/"/g, '""')}","${(c.descricao_titulo || '').replace(/"/g, '""')}",${formatCurrency(c.valor)},${formatDt(c.data_transacao)},${formatDt(c.data_vencimento)},${formatDt(c.data_conciliacao)},${c.status}`
      ),
      '',
      'Sobras (Transações sem título no ERP)',
      'Descrição,Valor,Data,Tipo',
      ...data.sobras.map(s => `"${(s.descricao || '').replace(/"/g, '""')}",${formatCurrency(s.valor)},${s.data},${s.tipo}`),
      '',
      'Faltas (Títulos sem transação no extrato)',
      'Descrição,Valor,Data Vencimento,Tipo',
      ...data.faltas.map(f => `"${(f.descricao || '').replace(/"/g, '""')}",${formatCurrency(f.valor)},${f.data_vencimento},${f.tipo}`),
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
