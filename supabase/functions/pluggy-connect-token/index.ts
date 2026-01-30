// Supabase Edge Function: cria um Connect Token da Pluggy
// Configure os secrets no Supabase: PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET

const PLUGGY_AUTH_URL = 'https://api.pluggy.ai/auth';
const PLUGGY_CONNECT_TOKEN_URL = 'https://api.pluggy.ai/connect_token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // CORS preflight
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

    // 1. Obter API Key da Pluggy
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

    // 2. Criar Connect Token
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

    return new Response(
      JSON.stringify({ connectToken }),
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
