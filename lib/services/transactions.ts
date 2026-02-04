import { supabase } from '../supabase';

export interface Transaction {
  id?: number;
  codigo_empresa: string; // user_id
  // Empresa selecionada dentro do usuário (multi-empresa)
  // Referência à tabela `empresas.id`
  empresa_id?: number | null;
  descricao: string;
  valor: number;
  data: string; // formato: YYYY-MM-DD
  tipo: 'receita' | 'despesa';
  categoria: string;
  conta_bancaria_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TransactionWithAccount extends Transaction {
  contas_bancarias?: {
    id: number;
    descricao: string;
  };
}

/**
 * Busca todas as transações do usuário
 */
export async function buscarTransacoes(userId: string, empresaId?: number | null) {
  let query = supabase
    .from('transacoes')
    .select(
      `
      *,
      contas_bancarias:conta_bancaria_id (
        id,
        descricao
      )
    `
    )
    .eq('codigo_empresa', userId);

  // Se uma empresa estiver selecionada, filtra por ela.
  // Isso permite que cada empresa tenha seu próprio conjunto de transações.
  if (empresaId) {
    query = query.eq('empresa_id', empresaId);
  }

  const { data, error } = await query
    .order('data', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar transações:', error);
    return { data: null, error };
  }

  return { data: data as TransactionWithAccount[], error: null };
}

/**
 * Cria uma nova transação
 */
export async function criarTransacao(transacao: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('transacoes')
      .insert([transacao])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar transação:', error);
      // Criar um erro mais descritivo
      const errorMessage = error.message || 'Erro desconhecido ao criar transação';
      const customError = new Error(errorMessage);
      (customError as any).originalError = error;
      throw customError;
    }

    return data;
  } catch (error: any) {
    // Se já é um Error, apenas relançar
    if (error instanceof Error) {
      throw error;
    }
    // Caso contrário, criar um novo Error
    throw new Error(error?.message || 'Erro ao criar transação');
  }
}

/**
 * Atualiza uma transação existente
 */
export async function atualizarTransacao(id: number, atualizacoes: Partial<Transaction>) {
  const { data, error } = await supabase
    .from('transacoes')
    .update({ ...atualizacoes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar transação:', error);
    throw error;
  }

  return data;
}

/**
 * Deleta uma transação
 */
export async function deletarTransacao(id: number) {
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar transação:', error);
    throw error;
  }
}
