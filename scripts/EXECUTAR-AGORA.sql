-- ===================================
-- EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ===================================
-- Este script cria/atualiza a função para confirmar email automaticamente
-- Execute apenas esta parte se já tiver executado o supabase-setup.sql antes

-- ===================================
-- FUNÇÃO RPC PARA CONFIRMAR EMAIL DE USUÁRIO
-- ===================================
CREATE OR REPLACE FUNCTION confirmar_email_usuario(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem confirmar emails';
  END IF;

  -- Verifica se o usuário existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Confirma o email do usuário
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;

-- ===================================
-- OPCIONAL: Confirmar emails de usuários já criados
-- ===================================
-- Se você já criou usuários que não conseguem fazer login,
-- execute este comando para confirmar todos os emails:

-- UPDATE auth.users
-- SET 
--   email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
--   confirmed_at = COALESCE(confirmed_at, NOW())
-- WHERE email_confirmed_at IS NULL;

-- ===================================
-- FUNÇÃO RPC PARA DELETAR USUÁRIO PERMANENTEMENTE
-- ===================================
CREATE OR REPLACE FUNCTION deletar_usuario_permanentemente(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem deletar usuários';
  END IF;

  -- Verifica se o usuário existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Não permite deletar a si mesmo
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode deletar sua própria conta';
  END IF;

  -- Deleta o perfil primeiro (se existir)
  DELETE FROM perfis WHERE usuario_id = p_user_id;

  -- Deleta o usuário da tabela auth.users
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION deletar_usuario_permanentemente(UUID) TO authenticated;

-- ===================================
-- VERIFICAR SE FUNÇÕES FORAM CRIADAS
-- ===================================
-- Execute para verificar se as funções existem:
-- SELECT routine_name 
-- FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('confirmar_email_usuario', 'deletar_usuario_permanentemente');
