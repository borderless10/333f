// Edge Function: pluggy-item-status
// Verifica o status de um item Pluggy e retorna se precisa renovação

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const PLUGGY_CLIENT_ID = Deno.env.get('PLUGGY_CLIENT_ID');
const PLUGGY_CLIENT_SECRET = Deno.env.get('PLUGGY_CLIENT_SECRET');
const PLUGGY_API_URL = 'https://api.pluggy.ai';

interface PluggyItemStatus {
  id: string;
  status: 'UPDATED' | 'UPDATING' | 'WAITING_USER_INPUT' | 'LOGIN_ERROR' | 'OUTDATED';
  executionStatus: 'SUCCESS' | 'ERROR' | 'PARTIAL_SUCCESS' | 'MERGING';
  lastUpdatedAt: string;
  createdAt: string;
  connector: {
    id: number;
    name: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

async function getPluggyAccessToken(): Promise<string> {
  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
    throw new Error('Credenciais Pluggy não configuradas');
  }

  const response = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId: PLUGGY_CLIENT_ID,
      clientSecret: PLUGGY_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ao autenticar na Pluggy: ${response.status}`);
  }

  const data = await response.json();
  return data.apiKey;
}

async function getItemStatus(itemId: string, apiKey: string): Promise<PluggyItemStatus> {
  const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar status do item: ${response.status}`);
  }

  return await response.json();
}

async function updateItem(itemId: string, apiKey: string): Promise<PluggyItemStatus> {
  const response = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    method: 'PATCH',
    headers: {
      'X-API-KEY': apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro ao atualizar item: ${response.status}`);
  }

  return await response.json();
}

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { itemId, autoUpdate } = await req.json();

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'itemId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Autenticar na Pluggy
    const apiKey = await getPluggyAccessToken();

    // Buscar status do item
    const status = await getItemStatus(itemId, apiKey);

    // Se autoUpdate=true e status for OUTDATED, atualizar automaticamente
    if (autoUpdate && status.status === 'OUTDATED') {
      const updatedStatus = await updateItem(itemId, apiKey);
      return new Response(
        JSON.stringify({
          status: updatedStatus,
          updated: true,
          message: 'Item atualizado automaticamente',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Retornar status
    return new Response(
      JSON.stringify({
        status,
        needsUpdate: status.status === 'OUTDATED' || status.status === 'LOGIN_ERROR',
        updated: false,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro na função pluggy-item-status:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao verificar status do item' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
