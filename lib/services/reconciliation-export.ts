import { formatCurrency } from '../utils/currency';
import {
  getReconciliationsWithDetails,
  getUnreconciledTransactions,
  getUnreconciledTitles,
  type ReconciliationWithDetails,
} from './reconciliation';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Gera relatório de conciliação completo
 */
export interface ReconciliationReport {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    totalConciliacoes: number;
    totalConciliado: number;
    totalNaoConciliado: number;
    taxaConciliacao: number;
    transacoesConciliadas: number;
    titulosConciliados: number;
    sobras: number;
    faltas: number;
  };
  conciliacoes: ReconciliationWithDetails[];
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
}

/**
 * Gera relatório completo de conciliação
 */
export async function generateReconciliationReport(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<ReconciliationReport> {
  const reconciliations = await getReconciliationsWithDetails(userId);
  const transactions = await getUnreconciledTransactions(userId);
  const titles = await getUnreconciledTitles(userId);

  // Filtrar por período se fornecido
  let filteredReconciliations = reconciliations;
  let filteredTransactions = transactions;
  let filteredTitles = titles;

  if (startDate && endDate) {
    filteredReconciliations = reconciliations.filter((rec) => {
      const recDate = new Date(rec.data_conciliacao);
      return recDate >= new Date(startDate) && recDate <= new Date(endDate);
    });

    filteredTransactions = transactions.filter((tx) => {
      return tx.data >= startDate && tx.data <= endDate;
    });

    filteredTitles = titles.filter((title) => {
      return title.data_vencimento >= startDate && title.data_vencimento <= endDate;
    });
  }

  // Calcular totais
  const totalConciliado = filteredReconciliations.reduce((sum, rec) => {
    return sum + (rec.transacao?.valor || 0);
  }, 0);

  const totalNaoConciliado =
    filteredTransactions.reduce((sum, tx) => sum + tx.valor, 0) +
    filteredTitles.reduce((sum, title) => sum + title.valor, 0);

  const totalTransacoes = filteredTransactions.length + filteredReconciliations.length;
  const taxaConciliacao =
    totalTransacoes > 0 ? (filteredReconciliations.length / totalTransacoes) * 100 : 0;

  return {
    periodo: {
      inicio: startDate || new Date(0).toISOString().split('T')[0],
      fim: endDate || new Date().toISOString().split('T')[0],
    },
    resumo: {
      totalConciliacoes: filteredReconciliations.length,
      totalConciliado,
      totalNaoConciliado,
      taxaConciliacao,
      transacoesConciliadas: filteredReconciliations.length,
      titulosConciliados: filteredReconciliations.length,
      sobras: filteredTransactions.length,
      faltas: filteredTitles.length,
    },
    conciliacoes: filteredReconciliations,
    sobras: filteredTransactions.map((tx) => ({
      id: tx.id!,
      descricao: tx.descricao,
      valor: tx.valor,
      data: tx.data,
    })),
    faltas: filteredTitles.map((title) => ({
      id: title.id!,
      descricao: title.descricao || title.fornecedor_cliente,
      valor: title.valor,
      data_vencimento: title.data_vencimento,
    })),
  };
}

/**
 * Exporta relatório para CSV
 */
export function exportReconciliationToCSV(report: ReconciliationReport): string {
  const lines: string[] = [];

  // Cabeçalho
  lines.push('RELATÓRIO DE CONCILIAÇÃO BANCÁRIA');
  lines.push(`Período: ${report.periodo.inicio} a ${report.periodo.fim}`);
  lines.push('');

  // Resumo
  lines.push('RESUMO');
  lines.push(`Total de Conciliações,${report.resumo.totalConciliacoes}`);
  lines.push(`Total Conciliado,${formatCurrency(report.resumo.totalConciliado)}`);
  lines.push(`Total Não Conciliado,${formatCurrency(report.resumo.totalNaoConciliado)}`);
  lines.push(`Taxa de Conciliação,${report.resumo.taxaConciliacao.toFixed(2)}%`);
  lines.push(`Sobras (Transações sem match),${report.resumo.sobras}`);
  lines.push(`Faltas (Títulos sem match),${report.resumo.faltas}`);
  lines.push('');

  // Conciliações
  lines.push('CONCILIAÇÕES REALIZADAS');
  lines.push('Data,Status,Transação,Valor Transação,Data Transação,Título,Valor Título,Data Vencimento,Diferença Valor,Diferença Dias');
  report.conciliacoes.forEach((rec) => {
    const date = new Date(rec.data_conciliacao).toLocaleDateString('pt-BR');
    lines.push(
      [
        date,
        rec.status,
        rec.transacao?.descricao || '',
        rec.transacao ? formatCurrency(rec.transacao.valor) : '',
        rec.transacao ? rec.transacao.data : '',
        rec.titulo?.fornecedor_cliente || '',
        rec.titulo ? formatCurrency(rec.titulo.valor) : '',
        rec.titulo ? rec.titulo.data_vencimento : '',
        formatCurrency(rec.diferenca_valor),
        rec.diferenca_dias.toString(),
      ].join(',')
    );
  });
  lines.push('');

  // Sobras
  if (report.sobras.length > 0) {
    lines.push('SOBRAS (Transações sem título correspondente)');
    lines.push('Descrição,Valor,Data');
    report.sobras.forEach((sobra) => {
      lines.push([sobra.descricao, formatCurrency(sobra.valor), sobra.data].join(','));
    });
    lines.push('');
  }

  // Faltas
  if (report.faltas.length > 0) {
    lines.push('FALTAS (Títulos sem transação correspondente)');
    lines.push('Descrição,Valor,Data Vencimento');
    report.faltas.forEach((falta) => {
      lines.push([falta.descricao, formatCurrency(falta.valor), falta.data_vencimento].join(','));
    });
  }

  return lines.join('\n');
}

/**
 * Exporta relatório para PDF (simulado - retorna CSV por enquanto)
 */
export async function exportReconciliationToPDF(
  report: ReconciliationReport
): Promise<string> {
  // Por enquanto, retorna CSV
  // Para PDF real, usar biblioteca como react-native-pdf ou similar
  return exportReconciliationToCSV(report);
}

/**
 * Salva e compartilha arquivo CSV
 */
export async function shareReconciliationReport(
  report: ReconciliationReport,
  format: 'csv' | 'pdf' = 'csv'
): Promise<void> {
  const content =
    format === 'csv' ? exportReconciliationToCSV(report) : await exportReconciliationToPDF(report);
  const extension = format === 'csv' ? 'csv' : 'pdf';
  const filename = `conciliacao_${new Date().toISOString().split('T')[0]}.${extension}`;

  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: format === 'csv' ? 'text/csv' : 'application/pdf',
        dialogTitle: 'Exportar Relatório de Conciliação',
      });
    } else {
      throw new Error('Compartilhamento não disponível neste dispositivo');
    }
  } catch (error: any) {
    console.error('Erro ao exportar relatório:', error);
    throw new Error('Não foi possível exportar o relatório');
  }
}
