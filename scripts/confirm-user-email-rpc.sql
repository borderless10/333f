-- ===================================
-- FUNÇÃO RPC PARA CONFIRMAR EMAIL DE USUÁRIO
-- ===================================
-- Esta função permite que admins confirmem o email de usuários recém-criados
-- para que possam fazer login imediatamente

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

-- ===================================
-- GRANT PERMISSIONS
-- ===================================
-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;
