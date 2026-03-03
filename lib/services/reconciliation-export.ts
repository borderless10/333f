import { formatCurrency } from '../utils/currency';
import {
  getReconciliationsWithDetails,
  getUnreconciledTransactions,
  getUnreconciledTitles,
  type ReconciliationWithDetails,
} from './reconciliation';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
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

export interface ReconciliationPDFOptions {
  empresaNome?: string;
  empresaLogoBase64?: string;
}

function escapeHtml(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDatePdf(s: string): string {
  if (!s?.trim()) return '—';
  try {
    const d = new Date(s);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Gera HTML formatado para PDF com logo e layout profissional
 */
function buildReconciliationPDFHTML(report: ReconciliationReport, options: ReconciliationPDFOptions = {}): string {
  const { empresaNome, empresaLogoBase64 } = options;
  const periodText = `Período: ${formatDatePdf(report.periodo.inicio)} a ${formatDatePdf(report.periodo.fim)}`;
  const taxaClass = report.resumo.taxaConciliacao >= 80 ? 'positive' : report.resumo.taxaConciliacao >= 50 ? 'warning' : 'negative';

  // Logo: imagem base64 ou SVG (ícone de conciliação)
  const logoHtml = empresaLogoBase64
    ? `<img src="data:image/png;base64,${empresaLogoBase64}" alt="Logo" style="height:48px;max-width:120px;object-fit:contain;" />`
    : `<div class="logo-placeholder">
        <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect width="48" height="48" rx="10" fill="#00b09b" opacity="0.15"/>
          <path d="M16 24h6l-3-6 3-6" stroke="#00b09b" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M32 24h-6l3 6-3 6" stroke="#00b09b" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="3" fill="#00b09b"/>
        </svg>
      </div>`;

  const conciliacoesRows =
    report.conciliacoes.length === 0
      ? '<tr><td colspan="8" class="empty">Nenhuma conciliação no período</td></tr>'
      : report.conciliacoes
          .map(
            (rec) => `
            <tr>
              <td>${formatDatePdf(rec.data_conciliacao)}</td>
              <td><span class="badge badge-${rec.status}">${rec.status === 'conciliado' ? 'Conciliado' : 'Com diferença'}</span></td>
              <td>${escapeHtml(rec.transacao?.descricao || '—')}</td>
              <td class="right">${rec.transacao ? formatCurrency(rec.transacao.valor) : '—'}</td>
              <td>${escapeHtml(rec.titulo?.fornecedor_cliente || '—')}</td>
              <td class="right">${rec.titulo ? formatCurrency(rec.titulo.valor) : '—'}</td>
              <td class="right">${formatCurrency(rec.diferenca_valor)}</td>
              <td class="center">${rec.diferenca_dias}d</td>
            </tr>`
          )
          .join('');

  const sobrasRows =
    report.sobras.length === 0
      ? '<tr><td colspan="4" class="empty">Nenhuma sobra</td></tr>'
      : report.sobras
          .map(
            (s) => `<tr>
              <td>${escapeHtml(s.descricao)}</td>
              <td class="right">${formatCurrency(s.valor)}</td>
              <td>${formatDatePdf(s.data)}</td>
              <td class="center">—</td>
            </tr>`
          )
          .join('');

  const faltasRows =
    report.faltas.length === 0
      ? '<tr><td colspan="4" class="empty">Nenhuma falta</td></tr>'
      : report.faltas
          .map(
            (f) => `<tr>
              <td>${escapeHtml(f.descricao)}</td>
              <td class="right">${formatCurrency(f.valor)}</td>
              <td>${formatDatePdf(f.data_vencimento)}</td>
              <td class="center">—</td>
            </tr>`
          )
          .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Conciliação Bancária</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      font-size: 11px;
      color: #1e293b;
      line-height: 1.5;
      padding: 24px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding-bottom: 20px;
      margin-bottom: 24px;
      border-bottom: 3px solid #00b09b;
    }
    .logo-placeholder { display: flex; align-items: center; justify-content: center; }
    .header-info { flex: 1; }
    .empresa-nome {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .report-title {
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }
    .period {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 8px;
    }
    h2 {
      font-size: 13px;
      font-weight: 600;
      color: #0f172a;
      margin: 20px 0 12px 0;
      padding-bottom: 6px;
    }
    .summary-grid {
      display: table;
      width: 100%;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .summary-row { display: table-row; }
    .summary-label {
      display: table-cell;
      padding: 10px 14px;
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      width: 45%;
      border-bottom: 1px solid #e2e8f0;
    }
    .summary-value {
      display: table-cell;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 500;
    }
    .summary-row:last-child .summary-label,
    .summary-row:last-child .summary-value { border-bottom: none; }
    .positive { color: #059669; font-weight: 600; }
    .negative { color: #dc2626; font-weight: 600; }
    .warning { color: #d97706; font-weight: 600; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-bottom: 24px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 600;
      color: #475569;
    }
    tr:nth-child(even) { background: #fafbfc; }
    .right { text-align: right; }
    .center { text-align: center; }
    .empty { color: #94a3b8; font-style: italic; text-align: center; }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 600;
    }
    .badge-conciliado { background: #d1fae5; color: #059669; }
    .badge-conciliado_com_diferenca { background: #fef3c7; color: #d97706; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
    }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    ${logoHtml}
    <div class="header-info">
      <div class="empresa-nome">${escapeHtml(empresaNome || 'Relatório de Conciliação')}</div>
      <div class="report-title">Conciliação Bancária</div>
      <div class="period">${periodText}</div>
    </div>
  </div>

  <h2>Resumo</h2>
  <div class="summary-grid">
    <div class="summary-row">
      <div class="summary-label">Total de conciliações</div>
      <div class="summary-value">${report.resumo.totalConciliacoes}</div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Total conciliado</div>
      <div class="summary-value positive">${formatCurrency(report.resumo.totalConciliado)}</div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Total não conciliado (sobras + faltas)</div>
      <div class="summary-value">${formatCurrency(report.resumo.totalNaoConciliado)}</div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Taxa de conciliação</div>
      <div class="summary-value ${taxaClass}">${report.resumo.taxaConciliacao.toFixed(1)}%</div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Sobras / Faltas</div>
      <div class="summary-value">${report.resumo.sobras} / ${report.resumo.faltas}</div>
    </div>
  </div>

  <h2>Conciliações realizadas</h2>
  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Status</th>
        <th>Transação</th>
        <th>Valor Tx</th>
        <th>Título</th>
        <th>Valor Tít.</th>
        <th>Dif. Valor</th>
        <th>Dif. Dias</th>
      </tr>
    </thead>
    <tbody>${conciliacoesRows}</tbody>
  </table>

  <h2>Sobras — transações sem título no ERP</h2>
  <table>
    <thead>
      <tr><th>Descrição</th><th class="right">Valor</th><th>Data</th><th class="center">—</th></tr>
    </thead>
    <tbody>${sobrasRows}</tbody>
  </table>

  <h2>Faltas — títulos sem transação no extrato</h2>
  <table>
    <thead>
      <tr><th>Descrição</th><th class="right">Valor</th><th>Vencimento</th><th class="center">—</th></tr>
    </thead>
    <tbody>${faltasRows}</tbody>
  </table>

  <p class="footer">
    Gerado em ${new Date().toLocaleString('pt-BR')} · Borderless 333f
  </p>
</body>
</html>`;
}

/**
 * Exporta relatório para PDF (arquivo real via expo-print)
 */
export async function exportReconciliationToPDF(
  report: ReconciliationReport,
  options: ReconciliationPDFOptions = {}
): Promise<string> {
  const html = buildReconciliationPDFHTML(report, options);
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return uri;
}

/**
 * Salva e compartilha arquivo CSV ou PDF
 */
export async function shareReconciliationReport(
  report: ReconciliationReport,
  format: 'csv' | 'pdf' = 'csv',
  pdfOptions?: ReconciliationPDFOptions
): Promise<void> {
  let fileUri: string;

  try {
    if (format === 'pdf') {
      fileUri = await exportReconciliationToPDF(report, pdfOptions ?? {});
    } else {
      const content = exportReconciliationToCSV(report);
      const filename = `conciliacao_${new Date().toISOString().split('T')[0]}.csv`;
      fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

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
    throw new Error(error.message || 'Não foi possível exportar o relatório');
  }
}
