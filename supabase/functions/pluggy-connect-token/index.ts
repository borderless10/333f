// Supabase Edge Function: cria um Connect Token da Pluggy
// Configure os secrets no Supabase: PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET
// Retorna redirectUrl (URL curta) para evitar truncamento da URL no app (Intent/Android)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_AUTH_URL = 'https://api.pluggy.ai/auth';
const PLUGGY_CONNECT_TOKEN_URL = 'https://api.pluggy.ai/connect_token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Credenciais Pluggy não configuradas. Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET nos secrets da função.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const clientUserId = (body?.userId ?? body?.clientUserId ?? '') as string;

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

    const connectBody: Record<string, unknown> = {};
    if (clientUserId) connectBody.clientUserId = clientUserId;

    const tokenRes = await fetch(PLUGGY_CONNECT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify(connectBody),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Pluggy connect_token error:', tokenRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'Falha ao criar Connect Token', details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tokenData = await tokenRes.json();
    const connectToken = tokenData?.accessToken ?? tokenData?.connectToken ?? tokenData?.token;

    if (!connectToken) {
      return new Response(
        JSON.stringify({ error: 'Resposta da Pluggy sem connectToken' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: row, error: insertError } = await supabase
      .from('pluggy_redirect_tokens')
      .insert({ token: connectToken })
      .select('id')
      .single();

    let redirectUrl: string | null = null;
    if (!insertError && row?.id) {
      redirectUrl = `${supabaseUrl}/functions/v1/pluggy-redirect/${row.id}`;
    }

    return new Response(
      JSON.stringify({ connectToken, redirectUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('pluggy-connect-token error:', e);
    return new Response(
      JSON.stringify({ error: 'Erro interno', message: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
