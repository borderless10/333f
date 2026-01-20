/**
 * Utilitários para parsing e validação de arquivos CSV
 */

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSV {
  headers: string[];
  rows: CSVRow[];
  errors: string[];
}

/**
 * Parse de arquivo CSV para array de objetos
 */
export function parseCSV(csvContent: string): ParsedCSV {
  const errors: string[] = [];
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    errors.push('Arquivo CSV está vazio');
    return { headers: [], rows: [], errors };
  }

  // Primeira linha são os headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  if (headers.length === 0) {
    errors.push('Cabeçalhos não encontrados no CSV');
    return { headers: [], rows: [], errors };
  }

  // Processar linhas de dados
  const rows: CSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    
    if (values.length !== headers.length) {
      errors.push(`Linha ${i + 1}: Número de colunas não corresponde aos cabeçalhos`);
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return { headers, rows, errors };
}

/**
 * Valida estrutura esperada do CSV de transações
 */
export interface TransactionCSVRow {
  descricao: string;
  valor: string;
  data: string;
  tipo: 'receita' | 'despesa';
  categoria: string;
  conta_bancaria?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRows: TransactionCSVRow[];
}

/**
 * Valida e normaliza dados do CSV de transações
 */
export function validateTransactionCSV(
  parsed: ParsedCSV,
  availableAccounts: { id: number; descricao: string }[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validRows: TransactionCSVRow[] = [];

  // Verificar cabeçalhos obrigatórios
  const requiredHeaders = ['descricao', 'valor', 'data', 'tipo', 'categoria'];
  const missingHeaders = requiredHeaders.filter(
    h => !parsed.headers.some(header => header.toLowerCase() === h.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    errors.push(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
    return { isValid: false, errors, warnings, validRows };
  }

  // Validar cada linha
  parsed.rows.forEach((row, index) => {
    const lineNumber = index + 2; // +2 porque linha 1 são headers
    const rowErrors: string[] = [];
    const rowWarnings: string[] = [];

    // Descrição (obrigatório, mínimo 3 caracteres)
    const descricao = row['descricao']?.trim() || row['Descrição']?.trim() || '';
    if (!descricao || descricao.length < 3) {
      rowErrors.push(`Linha ${lineNumber}: Descrição é obrigatória e deve ter pelo menos 3 caracteres`);
    }

    // Valor (obrigatório, deve ser número)
    const valorStr = row['valor']?.trim() || row['Valor']?.trim() || '';
    if (!valorStr) {
      rowErrors.push(`Linha ${lineNumber}: Valor é obrigatório`);
    } else {
      const valorNum = parseFloat(valorStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
      if (isNaN(valorNum) || valorNum <= 0) {
        rowErrors.push(`Linha ${lineNumber}: Valor inválido (${valorStr})`);
      }
    }

    // Data (obrigatório, formato DD/MM/YYYY ou YYYY-MM-DD)
    const dataStr = row['data']?.trim() || row['Data']?.trim() || '';
    if (!dataStr) {
      rowErrors.push(`Linha ${lineNumber}: Data é obrigatória`);
    } else {
      const dataValida = validarFormatoData(dataStr);
      if (!dataValida) {
        rowErrors.push(`Linha ${lineNumber}: Data inválida (${dataStr}). Use DD/MM/YYYY ou YYYY-MM-DD`);
      }
    }

    // Tipo (obrigatório, deve ser 'receita' ou 'despesa')
    const tipoStr = (row['tipo']?.trim() || row['Tipo']?.trim() || '').toLowerCase();
    if (!tipoStr || (tipoStr !== 'receita' && tipoStr !== 'despesa')) {
      rowErrors.push(`Linha ${lineNumber}: Tipo deve ser 'receita' ou 'despesa'`);
    }

    // Categoria (obrigatório)
    const categoria = row['categoria']?.trim() || row['Categoria']?.trim() || '';
    if (!categoria) {
      rowErrors.push(`Linha ${lineNumber}: Categoria é obrigatória`);
    }

    // Conta bancária (opcional, mas valida se informada)
    const contaStr = row['conta_bancaria']?.trim() || row['Conta Bancária']?.trim() || '';
    if (contaStr) {
      const contaEncontrada = availableAccounts.find(
        acc => acc.descricao.toLowerCase() === contaStr.toLowerCase()
      );
      if (!contaEncontrada) {
        rowWarnings.push(`Linha ${lineNumber}: Conta bancária '${contaStr}' não encontrada. Será ignorada.`);
      }
    }

    if (rowErrors.length === 0) {
      validRows.push({
        descricao,
        valor: valorStr,
        data: normalizarData(dataStr),
        tipo: tipoStr as 'receita' | 'despesa',
        categoria,
        conta_bancaria: contaStr || undefined,
      });
    } else {
      errors.push(...rowErrors);
    }

    if (rowWarnings.length > 0) {
      warnings.push(...rowWarnings);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validRows,
  };
}

/**
 * Valida formato de data
 */
function validarFormatoData(dataStr: string): boolean {
  // Formato DD/MM/YYYY
  const regex1 = /^\d{2}\/\d{2}\/\d{4}$/;
  // Formato YYYY-MM-DD
  const regex2 = /^\d{4}-\d{2}-\d{2}$/;

  if (regex1.test(dataStr)) {
    const [dia, mes, ano] = dataStr.split('/');
    const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    return data.getDate() === parseInt(dia) && 
           data.getMonth() === parseInt(mes) - 1 && 
           data.getFullYear() === parseInt(ano);
  }

  if (regex2.test(dataStr)) {
    const data = new Date(dataStr);
    return !isNaN(data.getTime());
  }

  return false;
}

/**
 * Normaliza data para formato YYYY-MM-DD
 */
function normalizarData(dataStr: string): string {
  // Se já está no formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return dataStr;
  }

  // Se está no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
    const [dia, mes, ano] = dataStr.split('/');
    return `${ano}-${mes}-${dia}`;
  }

  return dataStr;
}

/**
 * Gera template CSV para download
 */
export function generateCSVTemplate(): string {
  const headers = ['descricao', 'valor', 'data', 'tipo', 'categoria', 'conta_bancaria'];
  const exampleRows = [
    ['Pagamento fornecedor XYZ', '5000.00', '15/01/2025', 'despesa', 'Fornecedores', 'Conta Principal'],
    ['Recebimento cliente ABC', '12000.00', '20/01/2025', 'receita', 'Vendas', 'Conta Principal'],
  ];

  const csv = [
    headers.join(','),
    ...exampleRows.map(row => row.join(',')),
  ].join('\n');

  return csv;
}
