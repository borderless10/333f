import { supabase } from '../supabase';

/**
 * Tipos de provedores de integração bancária
 */
export type BankProvider = 'open_banking' | 'plugg' | 'belvo' | 'manual';

/**
 * Status da conexão bancária
 */
export type ConnectionStatus = 'active' | 'expired' | 'error' | 'pending';

/**
 * Tipo de conta bancária
 */
export type AccountType = 'checking' | 'savings' | 'investment';

/**
 * Interface para conexão bancária
 */
export interface BankConnection {
  id: string;
  userId: string;
  bankCode: number;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  provider: BankProvider;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  lastSyncAt?: Date;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface para transação bancária sincronizada
 */
export interface BankTransaction {
  id: string;
  connectionId: string;
  bankTransactionId: string;
  description: string;
  amount: number;
  date: Date;
  type: 'credit' | 'debit';
  category?: string;
  balance?: number;
  rawData?: any;
}

/**
 * Serviço base para integrações bancárias
 */
export abstract class BankIntegrationService {
  protected provider: BankProvider;

  constructor(provider: BankProvider) {
    this.provider = provider;
  }

  /**
   * Cria um link de autorização para conectar a conta bancária
   */
  abstract createConnectionLink(
    userId: string,
    bankCode: number,
    redirectUrl: string
  ): Promise<{ authUrl: string; connectionId: string }>;

  /**
   * Processa o callback após autorização do usuário
   */
  abstract handleCallback(
    connectionId: string,
    authCode: string
  ): Promise<BankConnection>;

  /**
   * Sincroniza transações de uma conta bancária
   */
  abstract syncTransactions(
    connectionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BankTransaction[]>;

  /**
   * Busca o saldo atual da conta
   */
  abstract getBalance(connectionId: string): Promise<number>;

  /**
   * Renova o token de acesso se necessário
   */
  abstract refreshToken(connectionId: string): Promise<void>;
}

/**
 * Implementação usando Plugg.to (exemplo)
 */
export class PluggIntegrationService extends BankIntegrationService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.plugg.to';

  constructor() {
    super('plugg');
    this.apiKey = process.env.EXPO_PUBLIC_PLUGG_API_KEY || '';
    this.apiSecret = process.env.EXPO_PUBLIC_PLUGG_API_SECRET || '';
  }

  async createConnectionLink(
    userId: string,
    bankCode: number,
    redirectUrl: string
  ): Promise<{ authUrl: string; connectionId: string }> {
    // TODO: Implementar chamada à API do Plugg.to
    // 1. Criar conexão no Plugg
    // 2. Obter URL de autorização
    // 3. Salvar conexão pendente no Supabase
    // 4. Retornar URL e connectionId

    throw new Error('Not implemented');
  }

  async handleCallback(
    connectionId: string,
    authCode: string
  ): Promise<BankConnection> {
    // TODO: Implementar
    // 1. Trocar authCode por accessToken
    // 2. Salvar tokens no Supabase
    // 3. Atualizar status para 'active'
    // 4. Fazer primeira sincronização

    throw new Error('Not implemented');
  }

  async syncTransactions(
    connectionId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BankTransaction[]> {
    // TODO: Implementar
    // 1. Buscar conexão no Supabase
    // 2. Fazer requisição à API do Plugg
    // 3. Processar transações
    // 4. Salvar no Supabase (evitando duplicatas)
    // 5. Atualizar lastSyncAt

    throw new Error('Not implemented');
  }

  async getBalance(connectionId: string): Promise<number> {
    // TODO: Implementar
    throw new Error('Not implemented');
  }

  async refreshToken(connectionId: string): Promise<void> {
    // TODO: Implementar renovação de token
    throw new Error('Not implemented');
  }
}

/**
 * Funções auxiliares para gerenciar conexões no Supabase
 */

/**
 * Salva uma nova conexão bancária
 */
export async function saveBankConnection(
  connection: Omit<BankConnection, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BankConnection> {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .insert([connection])
      .select()
      .single();

    if (error) {
      // Se a tabela não existe, informar o usuário
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
      }
      console.error('Erro ao salvar conexão bancária:', error);
      throw error;
    }

    return data;
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
export async function getUserBankConnections(
  userId: string
): Promise<BankConnection[]> {
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

    return data || [];
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
export async function getBankConnection(
  connectionId: string
): Promise<BankConnection | null> {
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

    return data;
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
export async function updateBankConnection(
  connectionId: string,
  updates: Partial<BankConnection>
): Promise<BankConnection> {
  try {
    const { data, error } = await supabase
      .from('bank_connections')
      .update({ ...updates, updated_at: new Date().toISOString() })
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

    return data;
  } catch (error: any) {
    if (error?.code === 'PGRST116' || error?.message?.includes('does not exist') || error?.message?.includes('schema cache')) {
      throw new Error('Tabela de conexões bancárias não encontrada. Execute o script SQL de setup no Supabase.');
    }
    throw error;
  }
}

/**
 * Salva transações sincronizadas
 */
export async function saveBankTransactions(
  transactions: Omit<BankTransaction, 'id'>[]
): Promise<BankTransaction[]> {
  const { data, error } = await supabase
    .from('bank_transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Erro ao salvar transações:', error);
    throw error;
  }

  return data || [];
}

/**
 * Busca transações de uma conexão
 */
export async function getBankTransactions(
  connectionId: string,
  startDate?: Date,
  endDate?: Date
): Promise<BankTransaction[]> {
  let query = supabase
    .from('bank_transactions')
    .select('*')
    .eq('connection_id', connectionId)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('date', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }

  return data || [];
}

/**
 * Lista de bancos disponíveis no Brasil
 */
export const AVAILABLE_BANKS = [
  { code: 1, name: 'Banco do Brasil' },
  { code: 33, name: 'Banco Santander' },
  { code: 104, name: 'Caixa Econômica Federal' },
  { code: 237, name: 'Banco Bradesco' },
  { code: 341, name: 'Banco Itaú' },
  { code: 356, name: 'Banco Real' },
  { code: 422, name: 'Banco Safra' },
  { code: 748, name: 'Banco Sicredi' },
  { code: 756, name: 'Bancoob' },
] as const;

/**
 * Busca informações de um banco pelo código
 */
export function getBankByCode(code: number) {
  return AVAILABLE_BANKS.find((bank) => bank.code === code);
}
