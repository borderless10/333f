-- ===================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE
-- ===================================
-- Execute estes comandos no SQL Editor do Supabase
-- na ordem em que aparecem

-- ===================================
-- 1. TABELA DE TRANSAÇÕES
-- ===================================
CREATE TABLE IF NOT EXISTS transacoes (
  id BIGSERIAL PRIMARY KEY,
  codigo_empresa TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  conta_bancaria_id BIGINT REFERENCES contas_bancarias(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_codigo_empresa ON transacoes(codigo_empresa);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON transacoes(data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON transacoes(tipo);

-- RLS (Row Level Security)
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias transações"
  ON transacoes FOR SELECT
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem criar suas próprias transações"
  ON transacoes FOR INSERT
  WITH CHECK (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem atualizar suas próprias transações"
  ON transacoes FOR UPDATE
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem deletar suas próprias transações"
  ON transacoes FOR DELETE
  USING (auth.uid()::text = codigo_empresa);

-- ===================================
-- 2. TABELA DE EMPRESAS
-- ===================================
CREATE TABLE IF NOT EXISTS empresas (
  id BIGSERIAL PRIMARY KEY,
  codigo_empresa TEXT NOT NULL,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj TEXT NOT NULL UNIQUE,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  observacoes TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_empresas_codigo_empresa ON empresas(codigo_empresa);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_ativa ON empresas(ativa);

-- RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver suas próprias empresas"
  ON empresas FOR SELECT
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem criar suas próprias empresas"
  ON empresas FOR INSERT
  WITH CHECK (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem atualizar suas próprias empresas"
  ON empresas FOR UPDATE
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem deletar suas próprias empresas"
  ON empresas FOR DELETE
  USING (auth.uid()::text = codigo_empresa);

-- ===================================
-- 3. TABELA DE TÍTULOS
-- ===================================
CREATE TABLE IF NOT EXISTS titulos (
  id BIGSERIAL PRIMARY KEY,
  codigo_empresa TEXT NOT NULL,
  descricao TEXT,
  fornecedor_cliente TEXT NOT NULL,
  valor DECIMAL(15, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'vencido')) DEFAULT 'pendente',
  conta_bancaria_id BIGINT REFERENCES contas_bancarias(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_titulos_codigo_empresa ON titulos(codigo_empresa);
CREATE INDEX IF NOT EXISTS idx_titulos_data_vencimento ON titulos(data_vencimento DESC);
CREATE INDEX IF NOT EXISTS idx_titulos_tipo ON titulos(tipo);
CREATE INDEX IF NOT EXISTS idx_titulos_status ON titulos(status);

-- RLS
ALTER TABLE titulos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver seus próprios títulos"
  ON titulos FOR SELECT
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem criar seus próprios títulos"
  ON titulos FOR INSERT
  WITH CHECK (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem atualizar seus próprios títulos"
  ON titulos FOR UPDATE
  USING (auth.uid()::text = codigo_empresa);

CREATE POLICY "Usuários podem deletar seus próprios títulos"
  ON titulos FOR DELETE
  USING (auth.uid()::text = codigo_empresa);

-- ===================================
-- 4. TABELA DE PERFIS
-- ===================================
CREATE TABLE IF NOT EXISTS perfis (
  id BIGSERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'analista', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(usuario_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfis_usuario_id ON perfis(usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfis_role ON perfis(role);

-- RLS
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Todos podem ver todos os perfis (para controle de acesso)
CREATE POLICY "Todos usuários autenticados podem ver perfis"
  ON perfis FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem modificar perfis
CREATE POLICY "Apenas admins podem criar perfis"
  ON perfis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE usuario_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem atualizar perfis"
  ON perfis FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE usuario_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Apenas admins podem deletar perfis"
  ON perfis FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE usuario_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ===================================
-- 5. FUNÇÃO RPC PARA BUSCAR USUÁRIOS
-- ===================================
-- Esta função permite buscar usuários com seus perfis
-- sem usar Service Role Key (que não funciona no free tier)

CREATE OR REPLACE FUNCTION buscar_usuarios_com_perfis()
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT,
  has_profile BOOLEAN
)
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
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem listar usuários';
  END IF;

  -- Retorna usuários com seus perfis
  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    u.created_at,
    p.role,
    (p.id IS NOT NULL) AS has_profile
  FROM auth.users u
  LEFT JOIN perfis p ON p.usuario_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

-- ===================================
-- 6. CRIAR PRIMEIRO ADMIN (IMPORTANTE!)
-- ===================================
-- Depois de criar seu usuário pelo signup, execute este comando
-- substituindo 'SEU_USER_ID' pelo ID do seu usuário
-- Você pode ver seu ID no SQL Editor com: SELECT id FROM auth.users;

-- EXEMPLO (substituir pelo seu UUID real):
-- INSERT INTO perfis (usuario_id, role)
-- VALUES ('SEU_USER_ID_AQUI', 'admin');

-- ===================================
-- 7. VERIFICAR INSTALAÇÃO
-- ===================================
-- Execute estas queries para verificar se tudo está OK:

-- Ver todas as tabelas criadas:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Ver seus perfis:
-- SELECT * FROM perfis;

-- Ver suas transações:
-- SELECT * FROM transacoes;

-- Ver suas empresas:
-- SELECT * FROM empresas;

-- Ver seus títulos:
-- SELECT * FROM titulos;

-- ===================================
-- PRONTO!
-- ===================================
-- Agora você pode usar o sistema completo
