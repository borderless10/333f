-- ===================================
-- MIGRAÇÃO: CORREÇÃO DUPLICIDADE DE CNPJ
-- ===================================
-- Data: 15/01/2026
-- Objetivo: Permitir mesmo CNPJ em empresas diferentes (Télos Control vs outras)
-- Tempo estimado: 1h

-- ===================================
-- PASSO 1: CRIAR TABELA EMPRESAS_TELOS
-- ===================================
-- Esta tabela representa as empresas "controladoras" como Télos Control
-- Cada empresa terá seus próprios clientes/empresas cadastradas

CREATE TABLE IF NOT EXISTS empresas_telos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  razao_social TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_telos_cnpj ON empresas_telos(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_telos_ativa ON empresas_telos(ativa);

-- RLS
ALTER TABLE empresas_telos ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ver todas as empresas Télos
CREATE POLICY "Usuários autenticados podem ver empresas Télos"
  ON empresas_telos FOR SELECT
  TO authenticated
  USING (true);

-- Política: Apenas admins podem criar empresas Télos
CREATE POLICY "Apenas admins podem criar empresas Télos"
  ON empresas_telos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE usuario_id = auth.uid()
      AND role = 'admin'
    )
  );

COMMENT ON TABLE empresas_telos IS 'Empresas controladoras do sistema (ex: Télos Control, Empresa Y, etc)';

-- ===================================
-- PASSO 2: ADICIONAR CAMPO empresa_telos_id
-- ===================================
-- Adicionar referência à empresa Télos nas tabelas relevantes

-- Adicionar em empresas (clientes das empresas Télos)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS empresa_telos_id UUID REFERENCES empresas_telos(id);

-- Adicionar em perfis (usuários pertencem a uma empresa Télos)
ALTER TABLE perfis ADD COLUMN IF NOT EXISTS empresa_telos_id UUID REFERENCES empresas_telos(id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_empresa_telos ON empresas(empresa_telos_id);
CREATE INDEX IF NOT EXISTS idx_perfis_empresa_telos ON perfis(empresa_telos_id);

-- ===================================
-- PASSO 3: REMOVER CONSTRAINT ÚNICA DE CNPJ
-- ===================================
-- Remover constraint que impede CNPJ duplicado globalmente

ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_cnpj_key;

-- ===================================
-- PASSO 4: CRIAR ÍNDICE ÚNICO COMPOSTO
-- ===================================
-- Novo índice: CNPJ só pode ser único DENTRO da mesma empresa Télos

CREATE UNIQUE INDEX IF NOT EXISTS empresas_cnpj_empresa_telos_unique_idx 
  ON empresas(cnpj, empresa_telos_id) 
  WHERE empresa_telos_id IS NOT NULL;

COMMENT ON INDEX empresas_cnpj_empresa_telos_unique_idx IS 'Garante que CNPJ é único apenas dentro da mesma empresa Télos';

-- ===================================
-- PASSO 5: CRIAR EMPRESA TÉLOS PADRÃO
-- ===================================
-- Criar a empresa Télos Control como padrão

INSERT INTO empresas_telos (id, nome, razao_social, ativa)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Télos Control',
  'Télos Control Ltda',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- PASSO 6: MIGRAR DADOS EXISTENTES
-- ===================================
-- Atribuir todas as empresas existentes para Télos Control

UPDATE empresas 
SET empresa_telos_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE empresa_telos_id IS NULL;

-- Atribuir todos os perfis existentes para Télos Control
UPDATE perfis 
SET empresa_telos_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE empresa_telos_id IS NULL;

-- ===================================
-- PASSO 7: ATUALIZAR RLS POLICIES
-- ===================================
-- Atualizar políticas para considerar empresa_telos_id

-- Remover políticas antigas de empresas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias empresas" ON empresas;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias empresas" ON empresas;

-- Criar novas políticas considerando empresa_telos_id
CREATE POLICY "Usuários veem empresas da sua empresa Télos"
  ON empresas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.usuario_id = auth.uid()
      AND p.empresa_telos_id = empresas.empresa_telos_id
    )
  );

CREATE POLICY "Usuários criam empresas na sua empresa Télos"
  ON empresas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.usuario_id = auth.uid()
      AND p.empresa_telos_id = empresas.empresa_telos_id
    )
  );

CREATE POLICY "Usuários atualizam empresas da sua empresa Télos"
  ON empresas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.usuario_id = auth.uid()
      AND p.empresa_telos_id = empresas.empresa_telos_id
    )
  );

CREATE POLICY "Usuários deletam empresas da sua empresa Télos"
  ON empresas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.usuario_id = auth.uid()
      AND p.empresa_telos_id = empresas.empresa_telos_id
    )
  );

-- ===================================
-- PASSO 8: FUNÇÃO HELPER PARA OBTER EMPRESA TÉLOS DO USUÁRIO
-- ===================================

CREATE OR REPLACE FUNCTION get_user_empresa_telos_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  empresa_id UUID;
BEGIN
  SELECT empresa_telos_id INTO empresa_id
  FROM perfis
  WHERE usuario_id = auth.uid()
  LIMIT 1;
  
  RETURN empresa_id;
END;
$$;

COMMENT ON FUNCTION get_user_empresa_telos_id() IS 'Retorna o ID da empresa Télos do usuário autenticado';

-- ===================================
-- PASSO 9: VERIFICAÇÃO DE DADOS
-- ===================================
-- Queries para verificar se migração foi bem-sucedida

-- Verificar empresas Télos criadas
-- SELECT * FROM empresas_telos;

-- Verificar se todas as empresas têm empresa_telos_id
-- SELECT COUNT(*) as total, COUNT(empresa_telos_id) as com_telos FROM empresas;

-- Verificar se todos os perfis têm empresa_telos_id
-- SELECT COUNT(*) as total, COUNT(empresa_telos_id) as com_telos FROM perfis;

-- Testar duplicidade de CNPJ (deve retornar erro se CNPJ duplicado na mesma empresa Télos)
-- INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id)
-- VALUES ('user-id', 'Teste', '12345678000190', '00000000-0000-0000-0000-000000000001');

-- ===================================
-- ROLLBACK (SE NECESSÁRIO)
-- ===================================
-- ⚠️ APENAS EXECUTE SE PRECISAR DESFAZER A MIGRAÇÃO

-- DROP INDEX IF EXISTS empresas_cnpj_empresa_telos_unique_idx;
-- ALTER TABLE empresas DROP COLUMN IF EXISTS empresa_telos_id;
-- ALTER TABLE perfis DROP COLUMN IF EXISTS empresa_telos_id;
-- DROP TABLE IF EXISTS empresas_telos CASCADE;
-- DROP FUNCTION IF EXISTS get_user_empresa_telos_id();

-- ===================================
-- CONCLUÍDO ✅
-- ===================================
-- A migração está completa!
-- Agora o sistema permite CNPJs duplicados entre empresas Télos diferentes.
