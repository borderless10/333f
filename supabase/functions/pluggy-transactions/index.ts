// Supabase Edge Function: busca transações da Pluggy
// Retorna transações de um itemId/accountId específico

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_AUTH_URL = 'https://api.pluggy.ai/auth';
const PLUGGY_TRANSACTIONS_URL = 'https://api.pluggy.ai/transactions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PluggyTransaction {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Credenciais Pluggy não configuradas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId as string;
    const accountId = body?.accountId as string | undefined;
    const from = body?.from as string | undefined; // Data início (YYYY-MM-DD)
    const to = body?.to as string | undefined; // Data fim (YYYY-MM-DD)
    const pageSize = body?.pageSize as number | undefined;

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'itemId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Autenticar com Pluggy
    const authRes = await fetch(PLUGGY_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      console.error('Pluggy auth error:', authRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha ao autenticar com Pluggy', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authData = await authRes.json();
    const apiKey = authData?.accessToken ?? authData?.apiKey ?? authData?.token;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Resposta da Pluggy sem apiKey' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar transações
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (pageSize) params.append('pageSize', String(pageSize));

    const url = `${PLUGGY_TRANSACTIONS_URL}?${params.toString()}`;

    const txRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!txRes.ok) {
      const errText = await txRes.text();
      console.error('Pluggy transactions error:', txRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha ao buscar transações', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const txData = await txRes.json();
    const transactions = (txData?.results ?? txData ?? []) as PluggyTransaction[];

    return new Response(
      JSON.stringify({ 
        transactions, 
        total: txData?.total ?? transactions.length,
        page: txData?.page ?? 1,
        totalPages: txData?.totalPages ?? 1,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('pluggy-transactions error:', e);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
