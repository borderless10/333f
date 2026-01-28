-- =====================================================
-- SPRINT 1 - INTEGRAÇÃO OPEN FINANCE - ESTRUTURA SQL
-- =====================================================
-- Este script cria as tabelas necessárias para integração
-- Open Finance (consentimentos, conexões, logs)
-- =====================================================

-- =====================================================
-- 1. TABELA: bank_connections
-- =====================================================
-- Armazena conexões bancárias via Open Finance
CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referência ao usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da conta bancária
  conta_bancaria_id BIGINT REFERENCES contas_bancarias(id) ON DELETE SET NULL,
  bank_code INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment')),
  
  -- Provedor de integração
  provider TEXT NOT NULL CHECK (provider IN ('open_banking', 'plugg', 'belvo', 'manual')),
  
  -- Tokens e autenticação
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Status da conexão
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'error', 'pending')) DEFAULT 'pending',
  
  -- Sincronização
  last_sync_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE bank_connections IS 'Armazena conexões bancárias via Open Finance';
COMMENT ON COLUMN bank_connections.provider IS 'Provedor de integração: open_banking, plugg, belvo ou manual';
COMMENT ON COLUMN bank_connections.status IS 'Status: active (ativa), expired (expirada), error (erro), pending (pendente)';

-- Índices
CREATE INDEX IF NOT EXISTS idx_bank_connections_user_id ON bank_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_status ON bank_connections(status);
CREATE INDEX IF NOT EXISTS idx_bank_connections_provider ON bank_connections(provider);
CREATE INDEX IF NOT EXISTS idx_bank_connections_conta_bancaria_id ON bank_connections(conta_bancaria_id);

-- =====================================================
-- 2. TABELA: integration_logs
-- =====================================================
-- Armazena logs de todas as operações de integração
CREATE TABLE IF NOT EXISTS integration_logs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Referência à conexão (opcional, pode ser null para logs gerais)
  connection_id UUID REFERENCES bank_connections(id) ON DELETE SET NULL,
  
  -- Usuário que executou a ação
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Tipo de operação
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'consent_created',
    'consent_renewed',
    'consent_revoked',
    'sync_transactions',
    'sync_balance',
    'token_refresh',
    'error'
  )),
  
  -- Status da operação
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'pending')) DEFAULT 'pending',
  
  -- Mensagem/descrição
  message TEXT,
  
  -- Dados adicionais (JSON)
  metadata JSONB,
  
  -- Erro (se houver)
  error_message TEXT,
  error_stack TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE integration_logs IS 'Logs de todas as operações de integração Open Finance';
COMMENT ON COLUMN integration_logs.operation_type IS 'Tipo: consent_created, consent_renewed, consent_revoked, sync_transactions, sync_balance, token_refresh, error';
COMMENT ON COLUMN integration_logs.metadata IS 'Dados adicionais em formato JSON';

-- Índices
CREATE INDEX IF NOT EXISTS idx_integration_logs_connection_id ON integration_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_user_id ON integration_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_operation_type ON integration_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created_at ON integration_logs(created_at DESC);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: bank_connections
CREATE POLICY "Usuários podem ver suas próprias conexões"
  ON bank_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias conexões"
  ON bank_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias conexões"
  ON bank_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias conexões"
  ON bank_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS: integration_logs
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON integration_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode criar logs"
  ON integration_logs FOR INSERT
  WITH CHECK (true); -- Permitir criação via funções

-- =====================================================
-- 4. FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_bank_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bank_connections_updated_at
  BEFORE UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_bank_connections_updated_at();

-- =====================================================
-- 5. FUNÇÃO: Registrar log automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION log_integration_operation(
  p_connection_id UUID,
  p_user_id UUID,
  p_operation_type TEXT,
  p_status TEXT,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO integration_logs (
    connection_id,
    user_id,
    operation_type,
    status,
    message,
    metadata,
    error_message
  ) VALUES (
    p_connection_id,
    p_user_id,
    p_operation_type,
    p_status,
    p_message,
    p_metadata,
    p_error_message
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Para executar:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Ctrl+Enter ou botão Run)
-- =====================================================
