-- Configuração de multi-empresa para transações e títulos
-- Torna possível ter saldos/lançamentos separados por empresa.
-- 
-- Seguro para rodar múltiplas vezes (idempotente).

-- 1) Adiciona coluna empresa_id em transacoes (se não existir)
ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS empresa_id bigint;

-- 2) Adiciona coluna empresa_id em titulos (se não existir)
ALTER TABLE public.titulos
ADD COLUMN IF NOT EXISTS empresa_id bigint;

-- 3) Cria FK para empresas (se ainda não existir)
DO $$
BEGIN
  -- FK em transacoes. Usa nome previsível e ignora erro se já existir.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'transacoes_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.transacoes
      ADD CONSTRAINT transacoes_empresa_id_fkey
      FOREIGN KEY (empresa_id)
      REFERENCES public.empresas(id)
      ON DELETE SET NULL;
  END IF;

  -- FK em titulos
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'titulos_empresa_id_fkey'
  ) THEN
    ALTER TABLE public.titulos
      ADD CONSTRAINT titulos_empresa_id_fkey
      FOREIGN KEY (empresa_id)
      REFERENCES public.empresas(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 4) (Opcional) Índices para performance por empresa
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa_id
  ON public.transacoes (empresa_id);

CREATE INDEX IF NOT EXISTS idx_titulos_empresa_id
  ON public.titulos (empresa_id);

-- Observação:
-- Não fazemos nenhum UPDATE automático para preencher empresa_id
-- porque a relação entre registros antigos e empresas pode variar.
-- A partir de agora, o app já envia empresa_id ao criar transações/títulos.

