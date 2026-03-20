-- =====================================================
-- MULTI-EMPRESA: CONTAS + OPEN FINANCE (empresa_id)
-- =====================================================
-- Objetivo:
-- 1) Adicionar empresa_id em contas_bancarias, bank_connections e integration_logs
-- 2) Criar FKs e indices para filtro por empresa
-- 3) Backfill inicial para reduzir dados sem empresa
-- 4) Atualizar RLS de bank_connections/integration_logs para isolamento por empresa
--
-- Observacao:
-- Este script e idempotente e pode ser executado mais de uma vez.
-- =====================================================

-- 1) Colunas empresa_id
ALTER TABLE public.contas_bancarias
  ADD COLUMN IF NOT EXISTS empresa_id bigint;

ALTER TABLE public.bank_connections
  ADD COLUMN IF NOT EXISTS empresa_id bigint;

ALTER TABLE public.integration_logs
  ADD COLUMN IF NOT EXISTS empresa_id bigint;

-- 2) FKs para empresas(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contas_bancarias_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.contas_bancarias
      ADD CONSTRAINT contas_bancarias_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_connections_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.bank_connections
      ADD CONSTRAINT bank_connections_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_logs_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.integration_logs
      ADD CONSTRAINT integration_logs_empresa_id_fkey
      FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- 3) Backfill inicial (usa a primeira empresa do usuario)
UPDATE public.contas_bancarias
SET empresa_id = (
  SELECT id
  FROM public.empresas
  WHERE codigo_empresa::text = contas_bancarias.codigo_empresa::text
  ORDER BY id
  LIMIT 1
)
WHERE empresa_id IS NULL;

UPDATE public.bank_connections
SET empresa_id = (
  SELECT id
  FROM public.empresas
  WHERE codigo_empresa::text = bank_connections.user_id::text
  ORDER BY id
  LIMIT 1
)
WHERE empresa_id IS NULL;

UPDATE public.integration_logs
SET empresa_id = (
  SELECT id
  FROM public.empresas
  WHERE codigo_empresa::text = integration_logs.user_id::text
  ORDER BY id
  LIMIT 1
)
WHERE empresa_id IS NULL;

-- 4) Indices para queries por usuario+empresa
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_codigo_empresa_empresa_id
  ON public.contas_bancarias (codigo_empresa, empresa_id);

CREATE INDEX IF NOT EXISTS idx_bank_connections_user_empresa
  ON public.bank_connections (user_id, empresa_id);

CREATE INDEX IF NOT EXISTS idx_integration_logs_user_empresa
  ON public.integration_logs (user_id, empresa_id);

-- 5) RLS multi-empresa para open finance
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias conexões" ON public.bank_connections;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias conexões" ON public.bank_connections;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias conexões" ON public.bank_connections;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias conexões" ON public.bank_connections;

DROP POLICY IF EXISTS "Usuários podem ver seus próprios logs" ON public.integration_logs;
DROP POLICY IF EXISTS "Sistema pode criar logs" ON public.integration_logs;

DO $$
BEGIN
  IF to_regclass('public.user_empresas') IS NOT NULL THEN
    EXECUTE '
      CREATE POLICY "bank_connections_select_multi_empresa"
      ON public.bank_connections FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bank_connections.empresa_id
            AND ue.ativo = true
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_insert_multi_empresa"
      ON public.bank_connections FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bank_connections.empresa_id
            AND ue.ativo = true
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_update_multi_empresa"
      ON public.bank_connections FOR UPDATE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bank_connections.empresa_id
            AND ue.ativo = true
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bank_connections.empresa_id
            AND ue.ativo = true
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_delete_multi_empresa"
      ON public.bank_connections FOR DELETE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = bank_connections.empresa_id
            AND ue.ativo = true
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "integration_logs_select_multi_empresa"
      ON public.integration_logs FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = integration_logs.empresa_id
            AND ue.ativo = true
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "integration_logs_insert_multi_empresa"
      ON public.integration_logs FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.user_empresas ue
          WHERE ue.user_id = auth.uid()
            AND ue.empresa_id = integration_logs.empresa_id
            AND ue.ativo = true
        )
      )
    ';
  ELSE
    -- Fallback sem user_empresas: usa empresas.codigo_empresa = auth.uid()
    EXECUTE '
      CREATE POLICY "bank_connections_select_multi_empresa_fallback"
      ON public.bank_connections FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = bank_connections.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_insert_multi_empresa_fallback"
      ON public.bank_connections FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = bank_connections.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_update_multi_empresa_fallback"
      ON public.bank_connections FOR UPDATE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = bank_connections.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = bank_connections.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "bank_connections_delete_multi_empresa_fallback"
      ON public.bank_connections FOR DELETE
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = bank_connections.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "integration_logs_select_multi_empresa_fallback"
      ON public.integration_logs FOR SELECT
      USING (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = integration_logs.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';

    EXECUTE '
      CREATE POLICY "integration_logs_insert_multi_empresa_fallback"
      ON public.integration_logs FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.empresas e
          WHERE e.id = integration_logs.empresa_id
            AND e.codigo_empresa = auth.uid()
        )
      )
    ';
  END IF;
END $$;

-- =====================================================
-- FIM
-- =====================================================
