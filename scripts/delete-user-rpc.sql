-- ===================================
-- FUNÇÃO RPC PARA DELETAR USUÁRIO PERMANENTEMENTE
-- ===================================
-- Esta função permite que admins deletem usuários completamente do sistema
-- incluindo da tabela auth.users

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
  -- Nota: Isso requer permissões especiais do Supabase
  -- Em alguns casos, pode ser necessário usar a API Admin do Supabase
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION deletar_usuario_permanentemente(UUID) TO authenticated;
