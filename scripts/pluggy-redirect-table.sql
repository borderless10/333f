-- =====================================================
-- Tabela para redirect do Pluggy Connect (evita URL longa truncada)
-- =====================================================
-- Execute no Supabase → SQL Editor
-- A Edge Function pluggy-redirect usa esta tabela para redirecionar
-- o navegador para a URL completa com o token.
-- =====================================================

CREATE TABLE IF NOT EXISTS pluggy_redirect_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limpar tokens antigos (opcional: rodar periodicamente)
-- DELETE FROM pluggy_redirect_tokens WHERE created_at < NOW() - INTERVAL '1 hour';

-- Permitir que a Edge Function (service role) leia e delete
-- RLS não é obrigatório aqui se só a Edge Function acessar com service_role
COMMENT ON TABLE pluggy_redirect_tokens IS 'Tokens temporários para redirect do Pluggy Connect (uso pela Edge Function pluggy-redirect)';
