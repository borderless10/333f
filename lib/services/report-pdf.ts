/**
 * Exportação de relatórios em PDF via expo-print
 * Gera HTML e converte para PDF; uso com expo-sharing para compartilhar/salvar
 */

import * as Print from 'expo-print';
import { formatCurrency } from '../utils/currency';
import type { ReconciliationReportData, CashFlowReportData } from './reports';

const PDF_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #1a1a2e; padding: 20px; line-height: 1.4; }
  h1 { font-size: 18px; margin: 0 0 4px 0; color: #0a192f; border-bottom: 2px solid #00b09b; padding-bottom: 8px; }
  .period { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  .section { margin-top: 20px; }
  .section-title { font-size: 14px; font-weight: 600; color: #0a192f; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
  th { background: #f1f5f9; font-weight: 600; color: #475569; }
  tr:nth-child(even) { background: #f8fafc; }
  .summary-grid { display: table; width: 100%; margin-bottom: 16px; }
  .summary-row { display: table-row; }
  .summary-label { display: table-cell; padding: 8px 12px; background: #f1f5f9; font-weight: 500; width: 50%; border: 1px solid #e2e8f0; }
  .summary-value { display: table-cell; padding: 8px 12px; border: 1px solid #e2e8f0; }
  .positive { color: #059669; }
  .negative { color: #dc2626; }
  .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; }
  .empty { color: #94a3b8; font-style: italic; }
`;

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDatePdf(s: string): string {
  if (!s?.trim()) return '—';
  try {
    const d = new Date(s);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Gera HTML do relatório Conciliado x Não Conciliado para PDF
 */
function buildReconciliationReportHTML(data: ReconciliationReportData): string {
  const periodText = `Período: ${formatDatePdf(data.period.start)} a ${formatDatePdf(data.period.end)}`;

  const conciliadosRows =
    data.conciliados.length === 0
      ? '<tr><td colspan="5" class="empty">Nenhum item conciliado no período</td></tr>'
      : data.conciliados
          .map(
            (c) =>
              `<tr>
                <td>${escapeHtml(c.descricao_tx)}</td>
                <td>${escapeHtml(c.descricao_titulo)}</td>
                <td>${formatCurrency(c.valor)}</td>
                <td>${formatDatePdf(c.data_transacao)}</td>
                <td>${c.status}</td>
              </tr>`
          )
          .join('');

  const sobrasRows =
    data.sobras.length === 0
      ? '<tr><td colspan="4" class="empty">Nenhuma sobra</td></tr>'
      : data.sobras
          .map(
            (s) =>
              `<tr>
                <td>${escapeHtml(s.descricao)}</td>
                <td>${formatCurrency(s.valor)}</td>
                <td>${formatDatePdf(s.data)}</td>
                <td>${s.tipo}</td>
              </tr>`
          )
          .join('');

  const faltasRows =
    data.faltas.length === 0
      ? '<tr><td colspan="4" class="empty">Nenhuma falta</td></tr>'
      : data.faltas
          .map(
            (f) =>
              `<tr>
                <td>${escapeHtml(f.descricao)}</td>
                <td>${formatCurrency(f.valor)}</td>
                <td>${formatDatePdf(f.data_vencimento)}</td>
                <td>${f.tipo}</td>
              </tr>`
          )
          .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${PDF_STYLES}</style>
</head>
<body>
  <h1>Relatório Conciliado x Não Conciliado</h1>
  <p class="period">${periodText}</p>

  <div class="section">
    <div class="section-title">Resumo</div>
    <div class="summary-grid">
      <div class="summary-row">
        <div class="summary-label">Total conciliado</div>
        <div class="summary-value positive">${formatCurrency(data.totalConciliado)}</div>
      </div>
      <div class="summary-row">
        <div class="summary-label">Não conciliado (sobras + faltas)</div>
        <div class="summary-value">${formatCurrency(data.totalNaoConciliado)}</div>
      </div>
      <div class="summary-row">
        <div class="summary-label">Taxa de conciliação</div>
        <div class="summary-value">${data.taxaConciliacao.toFixed(1)}%</div>
      </div>
      <div class="summary-row">
        <div class="summary-label">Transações conciliadas / Títulos conciliados</div>
        <div class="summary-value">${data.transacoesConciliadas} / ${data.titulosConciliados}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Conciliados (Transação ↔ Título)</div>
    <table>
      <thead><tr><th>Transação</th><th>Título</th><th>Valor</th><th>Data</th><th>Status</th></tr></thead>
      <tbody>${conciliadosRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Sobras (Extrato sem título no ERP)</div>
    <table>
      <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th><th>Tipo</th></tr></thead>
      <tbody>${sobrasRows}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Faltas (Título sem transação no extrato)</div>
    <table>
      <thead><tr><th>Descrição</th><th>Valor</th><th>Vencimento</th><th>Tipo</th></tr></thead>
      <tbody>${faltasRows}</tbody>
    </table>
  </div>

  <p class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} · Borderless</p>
</body>
</html>`;
}

/**
 * Gera HTML do relatório de Fluxo de Caixa para PDF
 */
function buildCashFlowReportHTML(data: CashFlowReportData): string {
  const periodText = `Período: ${formatDatePdf(data.period.start)} a ${formatDatePdf(data.period.end)}`;
  const netClass = data.totals.netBalance >= 0 ? 'positive' : 'negative';

  const dailyRows =
    data.daily.length === 0
      ? '<tr><td colspan="4" class="empty">Nenhum dado no período</td></tr>'
      : data.daily
          .slice(0, 90)
          .map(
            (d) =>
              `<tr>
                <td>${formatDatePdf(d.date)}</td>
                <td class="positive">${formatCurrency(d.income)}</td>
                <td class="negative">${formatCurrency(d.expense)}</td>
                <td>${formatCurrency(d.balance)}</td>
              </tr>`
          )
          .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${PDF_STYLES}</style>
</head>
<body>
  <h1>Relatório de Fluxo de Caixa</h1>
  <p class="period">${periodText}</p>

  <div class="section">
    <div class="section-title">Resumo</div>
    <div class="summary-grid">
      <div class="summary-row">
        <div class="summary-label">Total entradas</div>
        <div class="summary-value positive">${formatCurrency(data.totals.totalIncome)}</div>
      </div>
      <div class="summary-row">
        <div class="summary-label">Total saídas</div>
        <div class="summary-value negative">${formatCurrency(data.totals.totalExpense)}</div>
      </div>
      <div class="summary-row">
        <div class="summary-label">Saldo líquido</div>
        <div class="summary-value ${netClass}">${formatCurrency(data.totals.netBalance)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Fluxo diário (até 90 dias)</div>
    <table>
      <thead><tr><th>Data</th><th>Entradas</th><th>Saídas</th><th>Saldo</th></tr></thead>
      <tbody>${dailyRows}</tbody>
    </table>
  </div>

  <p class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} · Borderless</p>
</body>
</html>`;
}

export type ReportTypePDF = 'reconciliation' | 'cashflow';

/**
 * Gera PDF do relatório e retorna o URI do arquivo (cache)
 * Usar com expo-sharing para compartilhar ou salvar
 */
export async function exportReportToPDF(
  reportData: ReconciliationReportData | CashFlowReportData,
  type: ReportTypePDF
): Promise<string> {
  const html =
    type === 'reconciliation'
      ? buildReconciliationReportHTML(reportData as ReconciliationReportData)
      : buildCashFlowReportHTML(reportData as CashFlowReportData);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });
  return uri;
}
