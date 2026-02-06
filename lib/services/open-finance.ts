import { supabase } from '../supabase';
import { criarTransacao, type Transaction } from './transactions';
import { buscarContaPorId, type ContaBancaria } from '../contas';
import { AVAILABLE_BANKS, getBankByCode } from './bank-integrations';

// Re-exportar para facilitar uso
export { AVAILABLE_BANKS, getBankByCode };

/**
 * Tipos de operação de integração
 */
export type IntegrationOperationType =
  | 'consent_created'
  | 'consent_renewed'
  | 'consent_revoked'
  | 'sync_transactions'
  | 'sync_balance'
  | 'token_refresh'
  | 'error';

/**
 * Status de operação
 */
export type OperationStatus = 'success' | 'error' | 'pending';

/**
 * Interface para conexão bancária Open Finance
 */
export interface OpenFinanceConnection {
  id: string;
  user_id: string;
  conta_bancaria_id?: number | null;
  bank_code: number;
  bank_name: string;
  account_number: string;
  account_type: 'checking' | 'savings' | 'investment';
  provider: 'open_banking' | 'plugg' | 'belvo' | 'manual';
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  status: 'active' | 'expired' | 'error' | 'pending';
  last_sync_at?: string | null;
  pluggy_item_id?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para log de integração
 */
export interface IntegrationLog {
  id: number;
  connection_id?: string | null;
  user_id: string;
  operation_type: IntegrationOperationType;
  status: OperationStatus;
  message?: string | null;
  metadata?: any;
  error_message?: string | null;
  error_stack?: string | null;
  created_at: string;
}

/**
 * Interface para transação importada do banco
 */
export interface ImportedTransaction {
  bank_transaction_id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'credit' | 'debit';
  category?: string;
  balance?: number;
}

/**
 * Registra um log de integração
 */
export async function logIntegrationOperation(
  userId: string,
  operationType: IntegrationOperationType,
  status: OperationStatus,
  options?: {
    connectionId?: string;
    message?: string;
    metadata?: any;
    errorMessage?: string;
    errorStack?: string;
  }
): Promise<number> {
  try {
    // Tentar usar RPC primeiro (mais eficiente)
    const { data, error: rpcError } = await supabase.rpc('log_integration_operation', {
      p_connection_id: options?.connectionId || null,
      p_user_id: userId,
      p_operation_type: operationType,
      p_status: status,
      p_message: options?.message || null,
      p_metadata: options?.metadata || null,
      p_error_message: options?.errorMessage || null,
    });

    if (!rpcError) {
      return data || 0;
    }

    // Se RPC não existe ou falhou, tentar inserção direta
    if (rpcError.code === '42883' || rpcError.message?.includes('function') || rpcError.message?.includes('does not exist')) {
      console.warn('Função RPC log_integration_operation não encontrada. Usando inserção direta.');
      
      const { data: insertData, error: insertError } = await supabase
        .from('integration_logs')
        .insert([
          {
            connection_id: options?.connectionId || null,
            user_id: userId,
            operation_type: operationType,
            status,
            message: options?.message || null,
            metadata: options?.metadata || null,
            error_message: options?.errorMessage || null,
            error_stack: options?.errorStack || null,
          },
        ])
        .select('id')
        .single();

      if (insertError) {
        // Se a tabela não existe, apenas logar e retornar 0
        if (insertError.code === 'PGRST116' || insertError.message?.includes('does not exist') || insertError.message?.includes('schema cache')) {
          console.warn('Tabela integration_logs não encontrada. Log não foi registrado.');
          return 0;
        }
        console.error('Erro ao registrar log (inserção direta):', insertError);
        return 0;
      }

      return insertData?.id || 0;
    }

    // Outros erros do RPC
    console.error('Erro ao registrar log (RPC):', rpcError);
    return 0;
  } catch (error: any) {
    console.error('Erro ao registrar log:', error);
    return 0;
  }
}

/**
 * Busca logs de integração de um usuário
 */
export async function getIntegrationLogs(
  userId: string,
  options?: {
    connectionId?: string;
    operationType?: IntegrationOperationType;
    limit?: number;
  }
) {
  try {
    let query = supabase
      .from('integration_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.connectionId) {
      query = query.eq('connection_id', options.connectionId);
    }

    if (options?.operationType) {
      query = query.eq('operation_type', options.operationType);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      // Se a tabela não existe, retornar array vazio em vez de lançar erro
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        console.warn('Tabela integration_logs não encontrada. Execute o script SQL de setup.');
        return [];
      }
      console.error('Erro ao buscar logs:', error);
      throw error;
    }

    return (data || []) as IntegrationLog[];
  } catch (error: any) {
    // Tratamento adicional para erros de tabela não encontrada
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      console.warn('Tabela integration_logs não encontrada. Execute o script SQL de setup.');
      return [];
    }
    throw error;
  }
}

/**
 * Cria uma nova conexão bancária Open Finance
 */
export async function createOpenFinanceConnection(
  userId: string,
  connectionData: {
    conta_bancaria_id?: number;
    bank_code: number;
    bank_name: string;
    account_number: string;
    account_type: 'checking' | 'savings' | 'investment';
    provider: 'open_banking' | 'plugg' | 'belvo' | 'manual';
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    pluggy_item_id?: string;
    status?: 'active' | 'pending' | 'expired' | 'error';
  }
): Promise<OpenFinanceConnection> {
  try {
    const status = connectionData.status ?? (connectionData.pluggy_item_id ? 'active' : 'pending');
    const { data, error } = await supabase
      .from('bank_connections')
      .insert([
        {
          user_id: userId,
          ...connectionData,
          status,
        },
      ])
      .select()
      .single();

    if (error) {
      // Se a tabela não existe, informar o usuário
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
      }
      console.error('Erro ao criar conexão:', error);
      throw error;
    }

    // Registrar log (não bloquear se falhar)
    try {
      await logIntegrationOperation(userId, 'consent_created', 'success', {
        connectionId: data.id,
        message: `Conexão criada com ${connectionData.bank_name}`,
        metadata: { bank_code: connectionData.bank_code },
      });
    } catch (logError) {
      // Log de erro não deve impedir a criação da conexão
      console.warn('Erro ao registrar log de integração (não crítico):', logError);
    }

    return data as OpenFinanceConnection;
  } catch (error: any) {
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
    }
    throw error;
  }
}

/**
 * Busca todas as conexões de um usuário
 */
export async function getUserConnections(
  userId: string
): Promise<OpenFinanceConnection[]> {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Se a tabela não existe, retornar array vazio em vez de lançar erro
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        console.warn('Tabela bank_connections não encontrada. Execute o script SQL de setup.');
        return [];
      }
      console.error('Erro ao buscar conexões:', error);
      throw error;
    }

    return (data || []) as OpenFinanceConnection[];
  } catch (error: any) {
    // Tratamento adicional para erros de tabela não encontrada
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      console.warn('Tabela bank_connections não encontrada. Execute o script SQL de setup.');
      return [];
    }
    throw error;
  }
}

/**
 * Busca uma conexão específica
 */
export async function getConnection(
  connectionId: string
): Promise<OpenFinanceConnection | null> {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (error) {
      // Se a tabela não existe, retornar null em vez de lançar erro
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        console.warn('Tabela bank_connections não encontrada.');
        return null;
      }
      console.error('Erro ao buscar conexão:', error);
      return null;
    }

    return data as OpenFinanceConnection;
  } catch (error: any) {
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      return null;
    }
    console.error('Erro ao buscar conexão:', error);
    return null;
  }
}

/**
 * Atualiza uma conexão bancária
 */
export async function updateConnection(
  connectionId: string,
  updates: Partial<OpenFinanceConnection>
): Promise<OpenFinanceConnection> {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      // Se a tabela não existe, informar o usuário
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
      }
      console.error('Erro ao atualizar conexão:', error);
      throw error;
    }

    return data as OpenFinanceConnection;
  } catch (error: any) {
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
    }
    throw error;
  }
}

/**
 * Renova o consentimento de uma conexão
 */
export async function renewConsent(
  connectionId: string,
  userId: string,
  newAccessToken: string,
  newRefreshToken: string,
  expiresAt: string
): Promise<OpenFinanceConnection> {
  try {
    const connection = await updateConnection(connectionId, {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: expiresAt,
      status: 'active',
    });

    await logIntegrationOperation(userId, 'consent_renewed', 'success', {
      connectionId,
      message: 'Consentimento renovado com sucesso',
    });

    return connection;
  } catch (error: any) {
    await logIntegrationOperation(userId, 'consent_renewed', 'error', {
      connectionId,
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Revoga o consentimento de uma conexão
 */
export async function revokeConsent(
  connectionId: string,
  userId: string
): Promise<void> {
  try {
    await updateConnection(connectionId, {
      status: 'expired',
      access_token: null,
      refresh_token: null,
    });

    await logIntegrationOperation(userId, 'consent_revoked', 'success', {
      connectionId,
      message: 'Consentimento revogado',
    });
  } catch (error: any) {
    await logIntegrationOperation(userId, 'consent_revoked', 'error', {
      connectionId,
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Importa transações de uma conexão bancária com verificação de duplicatas
 */
export async function importTransactions(
  connectionId: string,
  userId: string,
  transactions: ImportedTransaction[],
  contaBancariaId?: number
): Promise<{ imported: number; errors: number; duplicates: number }> {
  let imported = 0;
  let errors = 0;
  let duplicates = 0;

  try {
    for (const bankTx of transactions) {
      try {
        // 1. Verificar se já existe transação com esse bank_transaction_id
        const { data: existingById, error: checkError } = await supabase
          .from('transacoes')
          .select('id')
          .eq('bank_transaction_id', bankTx.bank_transaction_id)
          .eq('codigo_empresa', userId)
          .maybeSingle();

        if (checkError) {
          console.error('Erro ao verificar duplicata por ID:', checkError);
        }

        if (existingById) {
          duplicates++;
          continue; // Pular transação duplicada
        }

        // 2. Verificar duplicata por valor + data + descrição (fallback)
        const { data: existingByData, error: checkError2 } = await supabase
          .from('transacoes')
          .select('id')
          .eq('codigo_empresa', userId)
          .eq('valor', Math.abs(bankTx.amount))
          .eq('data', bankTx.date)
          .eq('descricao', bankTx.description)
          .maybeSingle();

        if (checkError2) {
          console.error('Erro ao verificar duplicata por dados:', checkError2);
        }

        if (existingByData) {
          duplicates++;
          continue; // Pular transação duplicada
        }

        // 3. Converter tipo do banco para tipo do sistema
        const tipo = bankTx.type === 'credit' ? 'receita' : 'despesa';

        // 4. Criar transação no sistema
        const transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
          codigo_empresa: userId,
          descricao: bankTx.description,
          valor: Math.abs(bankTx.amount),
          data: bankTx.date,
          tipo,
          categoria: bankTx.category || 'Importado do Banco',
          conta_bancaria_id: contaBancariaId || null,
          bank_transaction_id: bankTx.bank_transaction_id, // Salvar ID do banco
        };

        await criarTransacao(transaction);
        imported++;
      } catch (error: any) {
        console.error(`Erro ao importar transação ${bankTx.bank_transaction_id}:`, error);
        errors++;
      }
    }

    // Atualizar last_sync_at
    await updateConnection(connectionId, {
      last_sync_at: new Date().toISOString(),
    });

    // Registrar log
    await logIntegrationOperation(userId, 'sync_transactions', 'success', {
      connectionId,
      message: `${imported} transações importadas, ${duplicates} duplicadas, ${errors} com erro`,
      metadata: { imported, duplicates, errors, total: transactions.length },
    });

    return { imported, errors, duplicates };
  } catch (error: any) {
    await logIntegrationOperation(userId, 'sync_transactions', 'error', {
      connectionId,
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Importa saldo de uma conta bancária
 */
export async function importBalance(
  connectionId: string,
  userId: string,
  balance: number,
  contaBancariaId?: number
): Promise<void> {
  try {
    // Aqui você pode salvar o saldo em uma tabela específica ou atualizar a conta
    // Por enquanto, apenas registramos o log
    // TODO: Criar tabela de saldos se necessário

    await logIntegrationOperation(userId, 'sync_balance', 'success', {
      connectionId,
      message: `Saldo importado: R$ ${balance.toFixed(2)}`,
      metadata: { balance, conta_bancaria_id: contaBancariaId },
    });

    // Atualizar last_sync_at
    await updateConnection(connectionId, {
      last_sync_at: new Date().toISOString(),
    });
  } catch (error: any) {
    await logIntegrationOperation(userId, 'sync_balance', 'error', {
      connectionId,
      errorMessage: error.message,
    });
    throw error;
  }
}

/**
 * Verifica se um token está expirado
 */
export function isTokenExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt) < new Date();
}

/**
 * Busca conexões expiradas que precisam de renovação
 */
export async function getExpiredConnections(
  userId: string
): Promise<OpenFinanceConnection[]> {
  const connections = await getUserConnections(userId);
  return connections.filter(
    (conn) => conn.status === 'active' && isTokenExpired(conn.expires_at)
  );
}
