-- ========================================
-- SISTEMA MULTIUSUÁRIO: Associação Usuário × Empresas
-- ========================================
-- Permite que um usuário acesse múltiplas empresas
-- e veja apenas as empresas às quais está associado.
--
-- Seguro para rodar múltiplas vezes (idempotente).
-- ========================================

-- 1) Criar tabela user_empresas (se não existir)
CREATE TABLE IF NOT EXISTS public.user_empresas (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id bigint NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  role text CHECK (role IN ('admin', 'analista', 'viewer')) DEFAULT 'viewer',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Garantir que um usuário não tenha duplicatas com a mesma empresa
  CONSTRAINT user_empresas_unique UNIQUE (user_id, empresa_id)
);

-- 2) Comentário da tabela
COMMENT ON TABLE public.user_empresas IS 
  'Associação entre usuários e empresas. Permite que um usuário acesse múltiplas empresas com diferentes níveis de permissão.';

COMMENT ON COLUMN public.user_empresas.role IS 
  'Nível de acesso do usuário nesta empresa específica: admin (acesso total), analista (criar/editar), viewer (apenas visualizar)';

COMMENT ON COLUMN public.user_empresas.ativo IS 
  'Se false, o usuário temporariamente não pode acessar esta empresa (sem deletar o vínculo)';

-- 3) Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_empresas_user_id 
  ON public.user_empresas (user_id);

CREATE INDEX IF NOT EXISTS idx_user_empresas_empresa_id 
  ON public.user_empresas (empresa_id);

CREATE INDEX IF NOT EXISTS idx_user_empresas_ativo 
  ON public.user_empresas (ativo) WHERE ativo = true;

-- 4) Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_empresas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_empresas_updated_at ON public.user_empresas;

CREATE TRIGGER trigger_update_user_empresas_updated_at
  BEFORE UPDATE ON public.user_empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_empresas_updated_at();

-- 5) Row Level Security (RLS)
ALTER TABLE public.user_empresas ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias associações
DROP POLICY IF EXISTS "Usuários podem ver suas empresas" ON public.user_empresas;

CREATE POLICY "Usuários podem ver suas empresas"
  ON public.user_empresas
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admins podem ver e gerenciar todas as associações
DROP POLICY IF EXISTS "Admins podem gerenciar todas associações" ON public.user_empresas;

CREATE POLICY "Admins podem gerenciar todas associações"
  ON public.user_empresas
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.perfis
      WHERE perfis.usuario_id = auth.uid()
      AND perfis.role = 'admin'
    )
  );

-- Política: Usuários podem criar suas próprias associações (auto-registro)
-- Comentada por padrão - descomente se quiser permitir auto-registro
-- DROP POLICY IF EXISTS "Usuários podem criar associações" ON public.user_empresas;
-- CREATE POLICY "Usuários podem criar associações"
--   ON public.user_empresas
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- 6) Função RPC: Buscar empresas do usuário autenticado
-- Remove a função antiga se existir (necessário quando mudamos o tipo de retorno)
DROP FUNCTION IF EXISTS buscar_empresas_usuario(boolean);

CREATE OR REPLACE FUNCTION buscar_empresas_usuario(p_incluir_inativas boolean DEFAULT false)
RETURNS TABLE (
  id bigint,
  codigo_empresa text,
  empresa_telos_id uuid,
  razao_social text,
  nome_fantasia text,
  cnpj text,
  ativa boolean,
  role text,
  associacao_ativa boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.codigo_empresa,
    e.empresa_telos_id::uuid,
    e.razao_social,
    e.nome_fantasia,
    e.cnpj,
    e.ativa,
    ue.role,
    ue.ativo as associacao_ativa,
    e.created_at
  FROM public.empresas e
  INNER JOIN public.user_empresas ue ON ue.empresa_id = e.id
  WHERE ue.user_id = auth.uid()
    AND (p_incluir_inativas OR (e.ativa = true AND ue.ativo = true))
  ORDER BY e.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION buscar_empresas_usuario IS 
  'Retorna todas as empresas às quais o usuário autenticado tem acesso, com seu nível de permissão em cada uma.';

-- 7) Função RPC: Verificar se usuário tem acesso a uma empresa
CREATE OR REPLACE FUNCTION usuario_tem_acesso_empresa(p_empresa_id bigint)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_empresas
    WHERE user_id = auth.uid()
      AND empresa_id = p_empresa_id
      AND ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION usuario_tem_acesso_empresa IS 
  'Verifica se o usuário autenticado tem acesso a uma empresa específica.';

-- 8) Função RPC: Buscar usuários de uma empresa (apenas admins)
CREATE OR REPLACE FUNCTION buscar_usuarios_empresa(p_empresa_id bigint)
RETURNS TABLE (
  user_id uuid,
  email text,
  role text,
  ativo boolean,
  created_at timestamptz
) AS $$
BEGIN
  -- Verifica se o usuário é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem ver usuários de empresas';
  END IF;

  RETURN QUERY
  SELECT 
    ue.user_id,
    u.email,
    ue.role,
    ue.ativo,
    ue.created_at
  FROM public.user_empresas ue
  INNER JOIN auth.users u ON u.id = ue.user_id
  WHERE ue.empresa_id = p_empresa_id
  ORDER BY ue.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION buscar_usuarios_empresa IS 
  'Retorna todos os usuários associados a uma empresa. Apenas admins podem executar.';

-- 9) Função RPC: Associar usuário a empresa (apenas admins)
CREATE OR REPLACE FUNCTION associar_usuario_empresa(
  p_user_id uuid,
  p_empresa_id bigint,
  p_role text DEFAULT 'viewer'
)
RETURNS bigint AS $$
DECLARE
  v_id bigint;
BEGIN
  -- Verifica se o usuário autenticado é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem associar usuários a empresas';
  END IF;

  -- Valida o role
  IF p_role NOT IN ('admin', 'analista', 'viewer') THEN
    RAISE EXCEPTION 'Role inválido. Use: admin, analista ou viewer';
  END IF;

  -- Insere ou atualiza a associação
  INSERT INTO public.user_empresas (user_id, empresa_id, role, ativo)
  VALUES (p_user_id, p_empresa_id, p_role, true)
  ON CONFLICT (user_id, empresa_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    ativo = true,
    updated_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION associar_usuario_empresa IS 
  'Associa um usuário a uma empresa com um nível de permissão. Apenas admins podem executar.';

-- 10) Função RPC: Remover associação usuário-empresa (apenas admins)
CREATE OR REPLACE FUNCTION desassociar_usuario_empresa(
  p_user_id uuid,
  p_empresa_id bigint
)
RETURNS boolean AS $$
BEGIN
  -- Verifica se o usuário autenticado é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem remover associações';
  END IF;

  DELETE FROM public.user_empresas
  WHERE user_id = p_user_id
    AND empresa_id = p_empresa_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION desassociar_usuario_empresa IS 
  'Remove a associação entre um usuário e uma empresa. Apenas admins podem executar.';

-- 11) Função RPC: Ativar/desativar associação (apenas admins)
CREATE OR REPLACE FUNCTION toggle_associacao_usuario_empresa(
  p_user_id uuid,
  p_empresa_id bigint,
  p_ativo boolean
)
RETURNS boolean AS $$
BEGIN
  -- Verifica se o usuário autenticado é admin
  IF NOT EXISTS (
    SELECT 1 FROM public.perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem alterar status de associações';
  END IF;

  UPDATE public.user_empresas
  SET ativo = p_ativo,
      updated_at = now()
  WHERE user_id = p_user_id
    AND empresa_id = p_empresa_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION toggle_associacao_usuario_empresa IS 
  'Ativa ou desativa uma associação usuário-empresa sem deletá-la. Apenas admins podem executar.';

-- ========================================
-- FIM DO SCRIPT
-- ========================================
-- Para testar:
-- 1. SELECT * FROM buscar_empresas_usuario(false);
-- 2. SELECT associar_usuario_empresa('user-uuid', 1, 'viewer');
-- 3. SELECT * FROM buscar_usuarios_empresa(1);
-- ========================================
