// Supabase Edge Function: busca contas e saldo da Pluggy
// Retorna contas (accounts) de um itemId com informações de saldo

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_AUTH_URL = 'https://api.pluggy.ai/auth';
const PLUGGY_ACCOUNTS_URL = 'https://api.pluggy.ai/accounts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PluggyAccount {
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

    // 2. Buscar contas do itemId
    const url = `${PLUGGY_ACCOUNTS_URL}?itemId=${itemId}`;

    const accountsRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
    });

    if (!accountsRes.ok) {
      const errText = await accountsRes.text();
      console.error('Pluggy accounts error:', accountsRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha ao buscar contas', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accountsData = await accountsRes.json();
    const accounts = (accountsData?.results ?? accountsData ?? []) as PluggyAccount[];

    return new Response(
      JSON.stringify({ 
        accounts,
        total: accounts.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('pluggy-accounts error:', e);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
