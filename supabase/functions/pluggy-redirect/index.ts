// Edge Function: redireciona para connect.pluggy.ai com o token na URL
// Evita truncar a URL longa no app (Intent/Android limita tamanho da URL)
// Uso: GET /functions/v1/pluggy-redirect/:id

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_CONNECT_URL = 'https://connect.pluggy.ai';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const id = pathParts[pathParts.length - 1];

    if (!id || id.length < 30) {
      return new Response(
        `<!DOCTYPE html><html><body><p>Link inválido ou expirado.</p></body></html>`,
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: row, error: fetchError } = await supabase
      .from('pluggy_redirect_tokens')
      .select('token')
      .eq('id', id)
      .single();

    if (fetchError || !row?.token) {
      return new Response(
        `<!DOCTYPE html><html><body><p>Link inválido ou já utilizado.</p></body></html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    await supabase.from('pluggy_redirect_tokens').delete().eq('id', id);

    // Incluir includeSandbox para tokens de desenvolvimento; a página pode validar o token com esse parâmetro
    const redirectUrl = `${PLUGGY_CONNECT_URL}?connectToken=${encodeURIComponent(row.token)}&includeSandbox=true`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('pluggy-redirect error:', e);
    return new Response(
      `<!DOCTYPE html><html><body><p>Erro ao redirecionar.</p></body></html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
});
