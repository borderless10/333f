/**
 * Serviço de integração com a Pluggy (Open Finance).
 * O Connect Token deve ser obtido via backend (Edge Function) por segurança.
 */

const getSupabaseUrl = () =>
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';

/**
 * Obtém um Connect Token da Pluggy via Edge Function do Supabase.
 * Requer que a função pluggy-connect-token esteja publicada e com secrets configurados.
 */
export async function getPluggyConnectToken(userId: string): Promise<string> {
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
  const connectToken = data?.connectToken;
  if (!connectToken) {
    throw new Error('Resposta da função sem connectToken.');
  }

  return connectToken;
}

/**
 * URL do Pluggy Connect para abrir no browser (conexão bancária).
 * O token é passado como parâmetro; o usuário conclui o fluxo na Pluggy.
 * Documentação: https://docs.pluggy.ai/docs/setup-pluggyconnect-widget-on-your-app
 */
export const PLUGGY_CONNECT_BASE_URL = 'https://connect.pluggy.ai';

/**
 * Monta a URL do Pluggy Connect com o connectToken (para abrir em WebView ou browser).
 * Se a Pluggy usar outro formato, ajuste conforme a documentação oficial.
 */
export function getPluggyConnectUrl(connectToken: string): string {
  return `${PLUGGY_CONNECT_BASE_URL}?connectToken=${encodeURIComponent(connectToken)}`;
}
