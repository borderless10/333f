import { supabase } from '../supabase';
import { type TransactionWithAccount } from './transactions';
import { type TitleWithAccount } from './titles';

/**
 * Interface para conciliação
 */
export interface Reconciliation {
  id?: number;
  transacao_id: number;
  titulo_id: number;
  status: 'conciliado' | 'conciliado_com_diferenca';
  diferenca_valor: number;
  diferenca_dias: number;
  observacoes?: string | null;
  usuario_id: string;
  data_conciliacao: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface para match sugerido
 */
export interface MatchSuggestion {
  transaction: TransactionWithAccount;
  title: TitleWithAccount;
  score: number; // 0-100, quanto maior melhor
  diferenca_valor: number;
  diferenca_dias: number;
  matchType: 'perfect' | 'value_match' | 'date_match' | 'close_match';
  descriptionMatch?: number; // 0-1, similaridade de descrição
}

/**
 * Configurações de matching
 */
export interface MatchingConfig {
  valorTolerance: number; // Tolerância em percentual (ex: 0.01 = 1%)
  dateTolerance: number; // Tolerância em dias (ex: 5 = ±5 dias)
  minScore: number; // Score mínimo para sugerir (0-100)
}

/**
 * Configuração padrão de matching
 */
const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  valorTolerance: 0.01, // 1% de tolerância
  dateTolerance: 5, // ±5 dias
  minScore: 60, // Score mínimo de 60%
};

/**
 * Calcula diferença em dias entre duas datas
 */
function diffDays(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d1.getTime() - d2.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula similaridade entre duas strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Verificar se uma contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Calcular similaridade usando Levenshtein simplificado
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // Contar palavras em comum
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  const wordSimilarity = commonWords.length / Math.max(words1.length, words2.length);

  // Similaridade de caracteres
  let charMatches = 0;
  const minLength = Math.min(s1.length, s2.length);
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) charMatches++;
  }
  const charSimilarity = charMatches / longer.length;

  // Média ponderada
  return (wordSimilarity * 0.7 + charSimilarity * 0.3);
}

/**
 * Calcula score de matching entre transação e título
 */
function calculateMatchScore(
  transaction: TransactionWithAccount,
  title: TitleWithAccount,
  config: MatchingConfig
): { score: number; diferenca_valor: number; diferenca_dias: number; matchType: MatchSuggestion['matchType']; descriptionMatch?: number } {
  // Verificar se tipos são compatíveis
  const tipoCompativel =
    (transaction.tipo === 'receita' && title.tipo === 'receber') ||
    (transaction.tipo === 'despesa' && title.tipo === 'pagar');

  if (!tipoCompativel) {
    return { score: 0, diferenca_valor: Infinity, diferenca_dias: Infinity, matchType: 'close_match' };
  }

  // Calcular diferença de valor
  const diferenca_valor = Math.abs(transaction.valor - title.valor);
  const valorPercentual = title.valor > 0 ? diferenca_valor / title.valor : 1;

  // Calcular diferença de dias
  const diferenca_dias = diffDays(transaction.data, title.data_vencimento);

  // Calcular similaridade de descrição
  const descTx = transaction.descricao || '';
  const descTitle = title.descricao || title.fornecedor_cliente || '';
  const descriptionMatch = stringSimilarity(descTx, descTitle);

  // Calcular score (0-100)
  let score = 100;

  // Penalizar por diferença de valor (até 40 pontos)
  if (valorPercentual <= config.valorTolerance) {
    score -= 0; // Match perfeito de valor
  } else if (valorPercentual <= config.valorTolerance * 2) {
    score -= 8; // Muito próximo
  } else if (valorPercentual <= config.valorTolerance * 5) {
    score -= 20; // Próximo
  } else {
    score -= 40; // Distante
  }

  // Penalizar por diferença de data (até 30 pontos)
  if (diferenca_dias === 0) {
    score -= 0; // Match perfeito de data
  } else if (diferenca_dias <= 1) {
    score -= 3; // 1 dia de diferença
  } else if (diferenca_dias <= config.dateTolerance) {
    score -= 10; // Dentro da tolerância
  } else if (diferenca_dias <= config.dateTolerance * 2) {
    score -= 20; // Fora da tolerância mas próximo
  } else {
    score -= 30; // Muito distante
  }

  // Bônus por similaridade de descrição (até 30 pontos)
  if (descriptionMatch >= 0.8) {
    score += 0; // Já está no máximo
  } else if (descriptionMatch >= 0.6) {
    score -= 5; // Boa similaridade
  } else if (descriptionMatch >= 0.4) {
    score -= 15; // Similaridade média
  } else {
    score -= 30; // Pouca similaridade
  }

  // Determinar tipo de match
  let matchType: MatchSuggestion['matchType'] = 'close_match';
  if (diferenca_valor === 0 && diferenca_dias === 0 && descriptionMatch >= 0.8) {
    matchType = 'perfect';
  } else if (diferenca_valor === 0) {
    matchType = 'value_match';
  } else if (diferenca_dias === 0) {
    matchType = 'date_match';
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    diferenca_valor,
    diferenca_dias,
    matchType,
    descriptionMatch,
  };
}

/**
 * Busca transações não conciliadas
 */
export async function getUnreconciledTransactions(userId: string): Promise<TransactionWithAccount[]> {
  try {
    // Buscar todas as transações
    const { data: allTransactions, error: txError } = await supabase
      .from('transacoes')
      .select(`
        *,
        contas_bancarias:conta_bancaria_id (
          id,
          descricao
        )
      `)
      .eq('codigo_empresa', userId)
      .order('data', { ascending: false });

    if (txError || !allTransactions) {
      return [];
    }

    // Buscar IDs de transações já conciliadas (se a tabela existir)
    try {
      const { data: reconciliations } = await supabase
        .from('conciliacoes')
        .select('transacao_id')
        .in(
          'transacao_id',
          allTransactions.map((t) => t.id!).filter(Boolean)
        );

      const reconciledIds = new Set(reconciliations?.map((r) => r.transacao_id) || []);

      // Filtrar transações não conciliadas
      return (allTransactions as TransactionWithAccount[]).filter(
        (t) => t.id && !reconciledIds.has(t.id)
      );
    } catch (reconciliationError: any) {
      // Se a tabela conciliacoes não existe, retornar todas as transações
      if (reconciliationError?.code === 'PGRST116' || reconciliationError?.message?.includes('does not exist') || reconciliationError?.message?.includes('schema cache')) {
        console.warn('Tabela conciliacoes não encontrada. Retornando todas as transações.');
        return allTransactions as TransactionWithAccount[];
      }
      throw reconciliationError;
    }
  } catch (error: any) {
    console.error('Erro ao buscar transações não conciliadas:', error);
    return [];
  }
}

/**
 * Busca títulos não conciliados
 */
export async function getUnreconciledTitles(userId: string): Promise<TitleWithAccount[]> {
  try {
    // Buscar todos os títulos
    const { data: allTitles, error: titleError } = await supabase
      .from('titulos')
      .select(`
        *,
        contas_bancarias:conta_bancaria_id (
          id,
          descricao
        )
      `)
      .eq('codigo_empresa', userId)
      .order('data_vencimento', { ascending: false });

    if (titleError || !allTitles) {
      return [];
    }

    // Buscar IDs de títulos já conciliados (se a tabela existir)
    try {
      const { data: reconciliations } = await supabase
        .from('conciliacoes')
        .select('titulo_id')
        .in(
          'titulo_id',
          allTitles.map((t) => t.id!).filter(Boolean)
        );

      const reconciledIds = new Set(reconciliations?.map((r) => r.titulo_id) || []);

      // Filtrar títulos não conciliados
      return (allTitles as TitleWithAccount[]).filter((t) => t.id && !reconciledIds.has(t.id));
    } catch (reconciliationError: any) {
      // Se a tabela conciliacoes não existe, retornar todos os títulos
      if (reconciliationError?.code === 'PGRST116' || reconciliationError?.message?.includes('does not exist') || reconciliationError?.message?.includes('schema cache')) {
        console.warn('Tabela conciliacoes não encontrada. Retornando todos os títulos.');
        return allTitles as TitleWithAccount[];
      }
      throw reconciliationError;
    }
  } catch (error: any) {
    console.error('Erro ao buscar títulos não conciliados:', error);
    return [];
  }
}

/**
 * Gera sugestões de matching automático
 */
export async function generateMatchSuggestions(
  userId: string,
  config: MatchingConfig = DEFAULT_MATCHING_CONFIG
): Promise<MatchSuggestion[]> {
  const transactions = await getUnreconciledTransactions(userId);
  const titles = await getUnreconciledTitles(userId);

  const suggestions: MatchSuggestion[] = [];

  // Comparar cada transação com cada título
  for (const transaction of transactions) {
    for (const title of titles) {
      const match = calculateMatchScore(transaction, title, config);

      if (match.score >= config.minScore) {
        suggestions.push({
          transaction,
          title,
          score: match.score,
          diferenca_valor: match.diferenca_valor,
          diferenca_dias: match.diferenca_dias,
          matchType: match.matchType,
          descriptionMatch: match.descriptionMatch,
        });
      }
    }
  }

  // Ordenar por score (maior primeiro)
  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Verifica se a tabela de conciliações existe e está acessível
 */
async function checkConciliacoesTableExists(): Promise<{ exists: boolean; error?: string }> {
  try {
    // Tentar uma query simples para verificar se a tabela existe
    // Usar limit(0) para não buscar dados, apenas verificar acesso
    const { error } = await supabase
      .from('conciliacoes')
      .select('id')
      .limit(0);

    if (error) {
      const errorCode = error.code;
      const errorMessage = error.message || '';
      
      // Verificar se é erro de tabela não encontrada
      if (
        errorCode === 'PGRST116' ||
        errorMessage.includes('does not exist') ||
        errorMessage.includes('schema cache') ||
        errorMessage.includes('relation "public.conciliacoes" does not exist') ||
        errorMessage.includes('relation "conciliacoes" does not exist')
      ) {
        return { exists: false, error: 'Tabela não encontrada' };
      }
      
      // Erro de RLS significa que a tabela existe, mas não temos permissão
      // Isso é OK, significa que a tabela existe
      if (
        errorCode === '42501' ||
        errorMessage.includes('permission denied') ||
        errorMessage.includes('row-level security')
      ) {
        return { exists: true, error: 'Tabela existe mas há restrições de permissão' };
      }
      
      // Outros erros podem indicar que a tabela existe mas há algum problema
      // Por segurança, assumimos que existe
      return { exists: true, error: errorMessage };
    }
    
    // Sem erro = tabela existe e está acessível
    return { exists: true };
  } catch (err: any) {
    const errorCode = err?.code;
    const errorMessage = err?.message || '';
    
    if (
      errorCode === 'PGRST116' ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('schema cache') ||
      errorMessage.includes('relation "public.conciliacoes" does not exist')
    ) {
      return { exists: false, error: 'Tabela não encontrada' };
    }
    
    // Por padrão, assumimos que a tabela existe se não for erro de "não encontrada"
    return { exists: true, error: errorMessage };
  }
}

/**
 * Analisa o erro e retorna uma mensagem específica
 */
function analyzeReconciliationError(error: any, userId: string, transacaoId: number, tituloId: number): string {
  const errorCode = error?.code;
  const errorMessage = error?.message || '';
  const errorDetails = error?.details || '';

  console.error('[createReconciliation] Erro detalhado:', {
    code: errorCode,
    message: errorMessage,
    details: errorDetails,
    hint: error?.hint,
    userId,
    transacaoId,
    tituloId,
  });

  // Erro de tabela não encontrada
  if (
    errorCode === 'PGRST116' ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('schema cache') ||
    errorMessage.includes('relation "public.conciliacoes" does not exist')
  ) {
    return 'Tabela de conciliações não encontrada. Execute o script SQL de setup no Supabase (scripts/reconciliation-setup.sql).';
  }

  // Erro de RLS (Row Level Security)
  if (
    errorCode === '42501' ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('new row violates row-level security policy') ||
    errorMessage.includes('RLS policy violation')
  ) {
    return `Permissão negada: Verifique se a transação (ID: ${transacaoId}) pertence ao seu usuário e se as políticas RLS estão configuradas corretamente.`;
  }

  // Erro de constraint única (já conciliado)
  if (
    errorCode === '23505' ||
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('unique_transacao_conciliacao') ||
    errorMessage.includes('unique_titulo_conciliacao') ||
    errorDetails.includes('unique')
  ) {
    if (errorMessage.includes('transacao_id') || errorDetails.includes('transacao_id')) {
      return `A transação (ID: ${transacaoId}) já está conciliada. Desfaça a conciliação existente primeiro.`;
    }
    if (errorMessage.includes('titulo_id') || errorDetails.includes('titulo_id')) {
      return `O título (ID: ${tituloId}) já está conciliado. Desfaça a conciliação existente primeiro.`;
    }
    return 'Esta conciliação já existe. Verifique se a transação ou título já foram conciliados.';
  }

  // Erro de foreign key (transação ou título não existe)
  if (
    errorCode === '23503' ||
    errorMessage.includes('foreign key constraint') ||
    errorMessage.includes('violates foreign key constraint')
  ) {
    if (errorMessage.includes('transacao_id') || errorDetails.includes('transacao_id')) {
      return `Transação não encontrada (ID: ${transacaoId}). Verifique se a transação existe e pertence ao seu usuário.`;
    }
    if (errorMessage.includes('titulo_id') || errorDetails.includes('titulo_id')) {
      return `Título não encontrado (ID: ${tituloId}). Verifique se o título existe e pertence ao seu usuário.`;
    }
    return 'Transação ou título não encontrado. Verifique se ambos existem e pertencem ao seu usuário.';
  }

  // Erro de validação (check constraint)
  if (
    errorCode === '23514' ||
    errorMessage.includes('check constraint') ||
    errorMessage.includes('violates check constraint')
  ) {
    if (errorMessage.includes('status')) {
      return 'Status inválido. O status deve ser "conciliado" ou "conciliado_com_diferenca".';
    }
    return 'Dados inválidos para conciliação. Verifique os valores informados.';
  }

  // Erro genérico com código
  if (errorCode) {
    return `Erro ao criar conciliação (Código: ${errorCode}): ${errorMessage || 'Erro desconhecido'}`;
  }

  // Erro genérico sem código
  return errorMessage || 'Erro desconhecido ao criar conciliação. Verifique os logs do console para mais detalhes.';
}

/**
 * Cria uma conciliação
 */
export async function createReconciliation(
  userId: string,
  transacaoId: number,
  tituloId: number,
  observacoes?: string
): Promise<Reconciliation> {
  try {
    // Verificar se a tabela existe primeiro
    const tableCheck = await checkConciliacoesTableExists();
    if (!tableCheck.exists) {
      throw new Error(
        'Tabela de conciliações não encontrada. Execute o script SQL de setup no Supabase:\n\n' +
        '1. Acesse o Supabase Dashboard\n' +
        '2. Vá em SQL Editor\n' +
        '3. Execute o arquivo: scripts/reconciliation-setup.sql\n' +
        '4. Verifique se não há erros na execução'
      );
    }

    // Buscar transação e título para calcular diferenças
    const { data: transaction, error: txError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('id', transacaoId)
      .single();

    if (txError) {
      console.error('[createReconciliation] Erro ao buscar transação:', txError);
      throw new Error(`Erro ao buscar transação (ID: ${transacaoId}): ${txError.message || 'Transação não encontrada'}`);
    }

    const { data: title, error: titleError } = await supabase
      .from('titulos')
      .select('*')
      .eq('id', tituloId)
      .single();

    if (titleError) {
      console.error('[createReconciliation] Erro ao buscar título:', titleError);
      throw new Error(`Erro ao buscar título (ID: ${tituloId}): ${titleError.message || 'Título não encontrado'}`);
    }

    if (!transaction || !title) {
      throw new Error('Transação ou título não encontrado');
    }

    // Verificar se transação e título pertencem ao usuário
    if (transaction.codigo_empresa !== userId) {
      throw new Error(`A transação (ID: ${transacaoId}) não pertence ao seu usuário.`);
    }
    if (title.codigo_empresa !== userId) {
      throw new Error(`O título (ID: ${tituloId}) não pertence ao seu usuário.`);
    }

    // Verificar se já estão conciliados (apenas se a tabela existe)
    try {
      const { data: existingTx, error: checkTxError } = await supabase
        .from('conciliacoes')
        .select('id')
        .eq('transacao_id', transacaoId)
        .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

      // Se não for erro de tabela não encontrada e encontrou registro, já está conciliado
      if (!checkTxError && existingTx) {
        throw new Error(`A transação (ID: ${transacaoId}) já está conciliada. Desfaça a conciliação existente primeiro.`);
      }

      const { data: existingTitle, error: checkTitleError } = await supabase
        .from('conciliacoes')
        .select('id')
        .eq('titulo_id', tituloId)
        .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

      // Se não for erro de tabela não encontrada e encontrou registro, já está conciliado
      if (!checkTitleError && existingTitle) {
        throw new Error(`O título (ID: ${tituloId}) já está conciliado. Desfaça a conciliação existente primeiro.`);
      }
    } catch (checkError: any) {
      // Se o erro não for de "já conciliado", relançar
      if (checkError.message?.includes('já está conciliad')) {
        throw checkError;
      }
      // Outros erros de verificação são ignorados (pode ser tabela não existe ainda)
      console.warn('[createReconciliation] Aviso ao verificar conciliações existentes:', checkError.message);
    }

    const diferenca_valor = Math.abs(transaction.valor - title.valor);
    const diferenca_dias = diffDays(transaction.data, title.data_vencimento);

    // Determinar status
    const status: 'conciliado' | 'conciliado_com_diferenca' =
      diferenca_valor === 0 && diferenca_dias === 0 ? 'conciliado' : 'conciliado_com_diferenca';

    // Criar conciliação
    const { data, error } = await supabase
      .from('conciliacoes')
      .insert([
        {
          transacao_id: transacaoId,
          titulo_id: tituloId,
          status,
          diferenca_valor,
          diferenca_dias,
          observacoes: observacoes || null,
          usuario_id: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      // Analisar o erro e retornar mensagem específica
      const errorMessage = analyzeReconciliationError(error, userId, transacaoId, tituloId);
      throw new Error(errorMessage);
    }

    if (!data) {
      throw new Error('Conciliação criada mas nenhum dado foi retornado. Verifique se a inserção foi bem-sucedida.');
    }

    console.log('[createReconciliation] Conciliação criada com sucesso:', data.id);
    return data as Reconciliation;
  } catch (error: any) {
    // Se já é um Error com mensagem customizada, apenas relançar
    if (error instanceof Error && error.message && !error.message.includes('[createReconciliation]')) {
      throw error;
    }

    // Analisar erro genérico
    const errorMessage = analyzeReconciliationError(error, userId, transacaoId, tituloId);
    throw new Error(errorMessage);
  }
}

/**
 * Remove uma conciliação (desfazer)
 */
export async function removeReconciliation(reconciliationId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('conciliacoes')
      .delete()
      .eq('id', reconciliationId);

    if (error) {
      // Se a tabela não existe, informar o usuário
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        throw new Error('Tabela de conciliações não encontrada. Execute o script SQL de setup no Supabase.');
      }
      console.error('Erro ao remover conciliação:', error);
      throw error;
    }
  } catch (error: any) {
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      throw new Error('Tabela de conciliações não encontrada. Execute o script SQL de setup no Supabase.');
    }
    throw error;
  }
}

/**
 * Busca conciliações de um usuário com detalhes
 */
export async function getReconciliations(userId: string): Promise<Reconciliation[]> {
  const { data, error } = await supabase
    .from('conciliacoes')
    .select('*')
    .eq('usuario_id', userId)
    .order('data_conciliacao', { ascending: false });

  if (error) {
    console.error('Erro ao buscar conciliações:', error);
    throw error;
  }

  return (data || []) as Reconciliation[];
}

/**
 * Busca conciliações com detalhes completos (transação + título)
 */
export interface ReconciliationWithDetails extends Reconciliation {
  transacao?: TransactionWithAccount;
  titulo?: TitleWithAccount;
}

export async function getReconciliationsWithDetails(
  userId: string,
  limit?: number
): Promise<ReconciliationWithDetails[]> {
  let reconciliations: Reconciliation[] = [];
  
  try {
    const { data, error } = await supabase
      .from('conciliacoes')
      .select('*')
      .eq('usuario_id', userId)
      .order('data_conciliacao', { ascending: false })
      .limit(limit || 100);

    if (error) {
      // Se a tabela não existe, retornar array vazio em vez de lançar erro
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        console.warn('Tabela conciliacoes não encontrada. Execute o script SQL de setup.');
        return [];
      }
      console.error('Erro ao buscar conciliações:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    reconciliations = data as Reconciliation[];
  } catch (error: any) {
    // Tratamento adicional para erros de tabela não encontrada
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      console.warn('Tabela conciliacoes não encontrada. Execute o script SQL de setup.');
      return [];
    }
    throw error;
  }

  // Buscar transações e títulos apenas se houver IDs
  const txIds = reconciliations.map((r) => r.transacao_id).filter(Boolean);
  const titleIds = reconciliations.map((r) => r.titulo_id).filter(Boolean);

  let transactions: any[] = [];
  let titles: any[] = [];

  if (txIds.length > 0) {
    const { data: txData } = await supabase
      .from('transacoes')
      .select(`
        *,
        contas_bancarias:conta_bancaria_id (
          id,
          descricao
        )
      `)
      .in('id', txIds);
    transactions = txData || [];
  }

  if (titleIds.length > 0) {
    const { data: titleData } = await supabase
      .from('titulos')
      .select(`
        *,
        contas_bancarias:conta_bancaria_id (
          id,
          descricao
        )
      `)
      .in('id', titleIds);
    titles = titleData || [];
  }

  const txMap = new Map(transactions.map((t) => [t.id, t]));
  const titleMap = new Map(titles.map((t) => [t.id, t]));

  return reconciliations.map((rec) => ({
    ...rec,
    transacao: txMap.get(rec.transacao_id) as TransactionWithAccount | undefined,
    titulo: titleMap.get(rec.titulo_id) as TitleWithAccount | undefined,
  })) as ReconciliationWithDetails[];
}

/**
 * Verifica se uma transação está conciliada
 */
export async function isTransactionReconciled(transacaoId: number): Promise<boolean> {
  const { data } = await supabase
    .from('conciliacoes')
    .select('id')
    .eq('transacao_id', transacaoId)
    .single();

  return !!data;
}

/**
 * Verifica se um título está conciliado
 */
export async function isTitleReconciled(tituloId: number): Promise<boolean> {
  const { data } = await supabase
    .from('conciliacoes')
    .select('id')
    .eq('titulo_id', tituloId)
    .single();

  return !!data;
}
