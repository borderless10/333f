/**
 * Serviço de integração com a Pluggy (Open Finance).
 * O Connect Token deve ser obtido via backend (Edge Function) por segurança.
 */

const getSupabaseUrl = () =>
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export interface PluggyConnectResult {
  connectToken: string;
  /** URL curta que redireciona para o Pluggy Connect (evita truncamento no Android) */
  redirectUrl?: string | null;
}

/**
 * Obtém Connect Token (e opcionalmente redirectUrl) via Edge Function do Supabase.
 * Use redirectUrl para abrir no navegador: evita truncamento da URL longa no Intent/Android.
 */
export async function getPluggyConnectToken(userId: string): Promise<PluggyConnectResult> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/pluggy-connect-token`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `Erro ao obter Connect Token (${res.status})`);
  }

  const data = await res.json();
  const connectToken = (data?.connectToken ?? data?.accessToken ?? data?.token ?? '').trim();
  if (!connectToken || connectToken.length < 10) {
    const msg = data?.error || data?.message || 'Resposta da função sem connectToken.';
    throw new Error(typeof msg === 'string' ? msg : 'Resposta da função sem connectToken.');
  }

  const redirectUrl = (data?.redirectUrl ?? '').trim() || null;
  return { connectToken, redirectUrl: redirectUrl || null };
}

/**
 * URL do Pluggy Connect para abrir no browser (conexão bancária).
 * O token é passado como parâmetro; o usuário conclui o fluxo na Pluggy.
 * Documentação: https://docs.pluggy.ai/docs/setup-pluggyconnect-widget-on-your-app
 */
export const PLUGGY_CONNECT_BASE_URL = 'https://connect.pluggy.ai';

/**
 * Monta a URL do Pluggy Connect com o connectToken (para abrir em WebView ou browser).
 * Inclui token na query e no hash para compatibilidade com a página da Pluggy.
 */
export function getPluggyConnectUrl(connectToken: string): string {
  const encoded = encodeURIComponent(connectToken);
  return `${PLUGGY_CONNECT_BASE_URL}?connectToken=${encoded}&token=${encoded}#connectToken=${encoded}`;
}

/**
 * Interface para transação da Pluggy
 */
export interface PluggyTransaction {
  id: string;
  description: string;
  descriptionRaw?: string;
  amount: number;
  date: string; // ISO date
  balance?: number;
  category?: string;
  type: 'DEBIT' | 'CREDIT';
  status: 'PENDING' | 'POSTED';
  currencyCode: string;
  accountId: string;
}

/**
 * Interface para conta da Pluggy
 */
export interface PluggyAccount {
  id: string;
  type: 'BANK' | 'CREDIT';
  subtype: 'CHECKING_ACCOUNT' | 'SAVINGS_ACCOUNT' | 'CREDIT_CARD';
  number?: string;
  name: string;
  balance: number;
  currencyCode: string;
  itemId: string;
  bankData?: {
    transferNumber?: string;
    closingBalance?: number;
  };
  creditData?: {
    level?: string;
    brand?: string;
    balanceCloseDate?: string;
    balanceDueDate?: string;
    availableCreditLimit?: number;
    balanceForeignCurrency?: number;
    minimumPayment?: number;
    creditLimit?: number;
  };
}

/**
 * Busca transações de um item Pluggy via Edge Function.
 * @param itemId - ID do item Pluggy (salvo em bank_connections.pluggy_item_id)
 * @param options - Opções de filtro (accountId, from, to, pageSize)
 */
export async function getPluggyTransactions(
  itemId: string,
  options?: {
    accountId?: string;
    from?: string; // YYYY-MM-DD
    to?: string; // YYYY-MM-DD
    pageSize?: number;
  }
): Promise<{
  transactions: PluggyTransaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/pluggy-transactions`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      itemId,
      accountId: options?.accountId,
      from: options?.from,
      to: options?.to,
      pageSize: options?.pageSize,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `Erro ao buscar transações (${res.status})`);
  }

  const data = await res.json();
  return {
    transactions: data.transactions || [],
    total: data.total || 0,
    page: data.page || 1,
    totalPages: data.totalPages || 1,
  };
}

/**
 * Busca contas (e saldo) de um item Pluggy via Edge Function.
 * @param itemId - ID do item Pluggy (salvo em bank_connections.pluggy_item_id)
 */
export async function getPluggyAccounts(itemId: string): Promise<{
  accounts: PluggyAccount[];
  total: number;
}> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/pluggy-accounts`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ itemId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `Erro ao buscar contas (${res.status})`);
  }

  const data = await res.json();
  return {
    accounts: data.accounts || [],
    total: data.total || 0,
  };
}

/**
 * Interface para resultado da verificação de status do item Pluggy
 */
export interface PluggyItemStatusResult {
  status: 'UPDATED' | 'UPDATING' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR' | 'OUTDATED';
  needsUpdate: boolean;
  renewed: boolean;
  needsUserAction: boolean;
  message?: string;
  lastUpdatedAt?: string;
}

/**
 * Verifica o status de um item Pluggy e opcionalmente renova automaticamente
 * @param itemId - ID do item Pluggy
 * @param autoRenew - Se true, tenta renovar automaticamente se estiver desatualizado
 */
export async function checkAndRenewPluggyItem(
  itemId: string,
  autoRenew: boolean = true
): Promise<PluggyItemStatusResult> {
  const baseUrl = getSupabaseUrl();
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/pluggy-item-status`;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ itemId, autoUpdate: autoRenew }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err?.error || err?.message || `Erro ao verificar status (${res.status})`);
  }

  const data = await res.json();
  
  return {
    status: data.status?.status || 'OUTDATED',
    needsUpdate: data.needsUpdate || false,
    renewed: data.updated || false,
    needsUserAction: data.status?.status === 'LOGIN_ERROR' || data.status?.status === 'WAITING_USER_INPUT',
    message: data.message,
    lastUpdatedAt: data.status?.lastUpdatedAt,
  };
}
