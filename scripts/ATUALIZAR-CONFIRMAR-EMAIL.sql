-- ===================================
-- ATUALIZAR FUNÇÃO CONFIRMAR EMAIL
-- ===================================
-- Execute este script no SQL Editor do Supabase para corrigir o erro
-- "column confirmed_at can only be updated to DEFAULT"
--
-- Este erro ocorre porque confirmed_at é uma coluna gerada automaticamente
-- e não pode ser atualizada diretamente.

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
  -- NOTA: confirmed_at é uma coluna gerada, não pode ser atualizada diretamente
  -- Apenas atualizamos email_confirmed_at, e o confirmed_at será gerado automaticamente
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;
