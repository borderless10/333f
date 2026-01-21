-- ===================================
-- FUNÇÃO RPC PARA CRIAR USUÁRIO COM PERFIL
-- ===================================
-- Esta função permite que admins criem novos usuários e perfis
-- usando SECURITY DEFINER para acessar auth.users

CREATE OR REPLACE FUNCTION criar_usuario_com_perfil(
  p_email TEXT,
  p_password TEXT,
  p_role TEXT,
  p_nome TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
  v_perfil_id INTEGER;
  v_result JSON;
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários';
  END IF;

  -- Valida o role
  IF p_role NOT IN ('admin', 'analista', 'viewer') THEN
    RAISE EXCEPTION 'Role inválido: deve ser admin, analista ou viewer';
  END IF;

  -- Verifica se o email já existe
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  ) THEN
    RAISE EXCEPTION 'Email já cadastrado: %', p_email;
  END IF;

  -- Cria o usuário usando a extensão pgcrypto para hash da senha
  -- Nota: Em produção, use a API Admin do Supabase ou Edge Functions
  -- Esta é uma solução alternativa usando SECURITY DEFINER
  
  -- Insere diretamente na tabela auth.users (requer permissões especiais)
  -- Como não podemos fazer isso diretamente, vamos usar uma abordagem diferente:
  -- Retornar instruções para criar via API ou usar signUp e depois criar perfil
  
  -- Por enquanto, vamos retornar um erro informando que é necessário usar signUp
  -- ou criar via Edge Function/API Admin
  RAISE EXCEPTION 'Para criar usuários administrativamente, use a API Admin do Supabase ou uma Edge Function. A função RPC não pode criar usuários diretamente em auth.users por questões de segurança.';
  
END;
$$;

-- ===================================
-- NOTA IMPORTANTE
-- ===================================
-- A função acima não pode criar usuários diretamente em auth.users
-- por questões de segurança do Supabase.
--
-- SOLUÇÕES ALTERNATIVAS:
--
-- 1. Usar signUp no cliente (implementado em criarNovoUsuario)
--    - Funciona, mas pode não funcionar se já estiver autenticado
--    - Requer que o admin faça logout temporariamente ou use outra sessão
--
-- 2. Criar uma Edge Function no Supabase
--    - Use a Service Role Key na Edge Function
--    - Chame admin.createUser() na Edge Function
--    - Chame a Edge Function do cliente
--
-- 3. Usar a API Admin diretamente (não recomendado no cliente)
--    - Nunca exponha a Service Role Key no cliente
--
-- A implementação atual em criarNovoUsuario() usa signUp,
-- que é a solução mais simples e segura para o cliente.
