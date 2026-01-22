-- =====================================================
-- SISTEMA DE CONCILIAÇÃO BANCÁRIA - ESTRUTURA DE BANCO
-- =====================================================
-- Este script cria as tabelas, índices e políticas RLS
-- necessárias para o sistema de conciliação bancária.
--
-- Data: 2026-01-XX
-- Versão: 1.0
-- =====================================================

-- =====================================================
-- 1. TABELA: conciliacoes
-- =====================================================
-- Armazena as conciliações entre transações bancárias e títulos ERP
CREATE TABLE IF NOT EXISTS conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Referências às entidades conciliadas
  transacao_id BIGINT NOT NULL REFERENCES transacoes(id) ON DELETE CASCADE,
  titulo_id BIGINT NOT NULL REFERENCES titulos(id) ON DELETE CASCADE,
  
  -- Status da conciliação
  status TEXT NOT NULL CHECK (status IN ('conciliado', 'conciliado_com_diferenca')),
  
  -- Diferenças identificadas
  diferenca_valor DECIMAL(15, 2) DEFAULT 0 CHECK (diferenca_valor >= 0),
  diferenca_dias INTEGER DEFAULT 0,
  
  -- Observações opcionais
  observacoes TEXT,
  
  -- Auditoria
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_conciliacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: uma transação só pode ser conciliada com um título
  CONSTRAINT unique_transacao_conciliacao UNIQUE (transacao_id),
  -- Constraint: um título só pode ser conciliado com uma transação
  CONSTRAINT unique_titulo_conciliacao UNIQUE (titulo_id)
);

-- Comentários nas colunas
COMMENT ON TABLE conciliacoes IS 'Armazena as conciliações entre transações bancárias e títulos ERP';
COMMENT ON COLUMN conciliacoes.transacao_id IS 'ID da transação bancária conciliada';
COMMENT ON COLUMN conciliacoes.titulo_id IS 'ID do título ERP conciliado';
COMMENT ON COLUMN conciliacoes.status IS 'Status: conciliado (match perfeito) ou conciliado_com_diferenca';
COMMENT ON COLUMN conciliacoes.diferenca_valor IS 'Diferença de valor entre transação e título (sempre positiva)';
COMMENT ON COLUMN conciliacoes.diferenca_dias IS 'Diferença em dias entre data da transação e vencimento do título';
COMMENT ON COLUMN conciliacoes.observacoes IS 'Observações adicionais sobre a conciliação';
COMMENT ON COLUMN conciliacoes.usuario_id IS 'Usuário que realizou a conciliação';
COMMENT ON COLUMN conciliacoes.data_conciliacao IS 'Data e hora em que a conciliação foi realizada';

-- =====================================================
-- 2. TABELA: historico_conciliacoes
-- =====================================================
-- Armazena o histórico de todas as ações realizadas nas conciliações
CREATE TABLE IF NOT EXISTS historico_conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Referência à conciliação
  conciliacao_id BIGINT NOT NULL REFERENCES conciliacoes(id) ON DELETE CASCADE,
  
  -- Tipo de ação realizada
  acao TEXT NOT NULL CHECK (acao IN ('criada', 'desfeita', 'editada')),
  
  -- Auditoria
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_acao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Dados anteriores (para auditoria completa)
  dados_anteriores JSONB,
  
  -- Dados novos (para auditoria completa)
  dados_novos JSONB,
  
  -- Observações sobre a ação
  observacoes TEXT
);

-- Comentários nas colunas
COMMENT ON TABLE historico_conciliacoes IS 'Histórico de todas as ações realizadas nas conciliações';
COMMENT ON COLUMN historico_conciliacoes.conciliacao_id IS 'ID da conciliação relacionada';
COMMENT ON COLUMN historico_conciliacoes.acao IS 'Tipo de ação: criada, desfeita ou editada';
COMMENT ON COLUMN historico_conciliacoes.dados_anteriores IS 'Dados da conciliação antes da ação (JSON)';
COMMENT ON COLUMN historico_conciliacoes.dados_novos IS 'Dados da conciliação após a ação (JSON)';

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices na tabela conciliacoes
CREATE INDEX IF NOT EXISTS idx_conciliacoes_transacao 
  ON conciliacoes(transacao_id);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_titulo 
  ON conciliacoes(titulo_id);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_status 
  ON conciliacoes(status);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_usuario 
  ON conciliacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_conciliacoes_data_conciliacao 
  ON conciliacoes(data_conciliacao DESC);

-- Índice composto para buscas comuns
CREATE INDEX IF NOT EXISTS idx_conciliacoes_status_data 
  ON conciliacoes(status, data_conciliacao DESC);

-- Índices na tabela historico_conciliacoes
CREATE INDEX IF NOT EXISTS idx_historico_conciliacao 
  ON historico_conciliacoes(conciliacao_id);

CREATE INDEX IF NOT EXISTS idx_historico_usuario 
  ON historico_conciliacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_historico_data_acao 
  ON historico_conciliacoes(data_acao DESC);

CREATE INDEX IF NOT EXISTS idx_historico_acao 
  ON historico_conciliacoes(acao);

-- =====================================================
-- 4. FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_conciliacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_conciliacoes_updated_at
  BEFORE UPDATE ON conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_conciliacoes_updated_at();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_conciliacoes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. POLÍTICAS RLS: conciliacoes
-- =====================================================

-- Política: Usuários podem ver conciliações de suas empresas
CREATE POLICY "Usuários podem ver conciliações de suas empresas"
  ON conciliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND (
        -- Verificar se a transação pertence ao usuário
        t.codigo_empresa = auth.uid()::text
        OR
        -- Verificar se o usuário tem perfil de admin
        EXISTS (
          SELECT 1 FROM perfis p
          WHERE p.usuario_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  );

-- Política: Usuários podem criar conciliações
CREATE POLICY "Usuários podem criar conciliações"
  ON conciliacoes FOR INSERT
  WITH CHECK (
    -- Verificar se a transação pertence ao usuário
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND t.codigo_empresa = auth.uid()::text
    )
    OR
    -- Admin pode criar para qualquer empresa
    EXISTS (
      SELECT 1 FROM perfis p
      WHERE p.usuario_id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Política: Usuários podem atualizar conciliações
CREATE POLICY "Usuários podem atualizar conciliações"
  ON conciliacoes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND (
        t.codigo_empresa = auth.uid()::text
        OR
        EXISTS (
          SELECT 1 FROM perfis p
          WHERE p.usuario_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND (
        t.codigo_empresa = auth.uid()::text
        OR
        EXISTS (
          SELECT 1 FROM perfis p
          WHERE p.usuario_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  );

-- Política: Usuários podem deletar conciliações
CREATE POLICY "Usuários podem deletar conciliações"
  ON conciliacoes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND (
        t.codigo_empresa = auth.uid()::text
        OR
        EXISTS (
          SELECT 1 FROM perfis p
          WHERE p.usuario_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  );

-- =====================================================
-- 7. POLÍTICAS RLS: historico_conciliacoes
-- =====================================================

-- Política: Usuários podem ver histórico de conciliações de suas empresas
CREATE POLICY "Usuários podem ver histórico de conciliações"
  ON historico_conciliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conciliacoes c
      JOIN transacoes t ON t.id = c.transacao_id
      WHERE c.id = historico_conciliacoes.conciliacao_id
      AND (
        t.codigo_empresa = auth.uid()::text
        OR
        EXISTS (
          SELECT 1 FROM perfis p
          WHERE p.usuario_id = auth.uid()
          AND p.role = 'admin'
        )
      )
    )
  );

-- Política: Sistema pode inserir histórico (via função)
CREATE POLICY "Sistema pode inserir histórico"
  ON historico_conciliacoes FOR INSERT
  WITH CHECK (true); -- Permitir inserção via funções do sistema

-- =====================================================
-- 8. FUNÇÕES AUXILIARES
-- =====================================================

-- Função: Registrar histórico automaticamente ao criar conciliação
CREATE OR REPLACE FUNCTION registrar_historico_conciliacao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico_conciliacoes (
    conciliacao_id,
    acao,
    usuario_id,
    dados_novos
  ) VALUES (
    NEW.id,
    'criada',
    NEW.usuario_id,
    jsonb_build_object(
      'transacao_id', NEW.transacao_id,
      'titulo_id', NEW.titulo_id,
      'status', NEW.status,
      'diferenca_valor', NEW.diferenca_valor,
      'diferenca_dias', NEW.diferenca_dias,
      'observacoes', NEW.observacoes
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar histórico ao criar
CREATE TRIGGER trigger_registrar_historico_criacao
  AFTER INSERT ON conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_conciliacao();

-- Função: Registrar histórico ao deletar conciliação
CREATE OR REPLACE FUNCTION registrar_historico_desfazer()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico_conciliacoes (
    conciliacao_id,
    acao,
    usuario_id,
    dados_anteriores
  ) VALUES (
    OLD.id,
    'desfeita',
    OLD.usuario_id,
    jsonb_build_object(
      'transacao_id', OLD.transacao_id,
      'titulo_id', OLD.titulo_id,
      'status', OLD.status,
      'diferenca_valor', OLD.diferenca_valor,
      'diferenca_dias', OLD.diferenca_dias,
      'observacoes', OLD.observacoes
    )
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar histórico ao deletar
CREATE TRIGGER trigger_registrar_historico_desfazer
  BEFORE DELETE ON conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_desfazer();

-- Função: Registrar histórico ao atualizar conciliação
CREATE OR REPLACE FUNCTION registrar_historico_edicao()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO historico_conciliacoes (
    conciliacao_id,
    acao,
    usuario_id,
    dados_anteriores,
    dados_novos
  ) VALUES (
    NEW.id,
    'editada',
    NEW.usuario_id,
    jsonb_build_object(
      'transacao_id', OLD.transacao_id,
      'titulo_id', OLD.titulo_id,
      'status', OLD.status,
      'diferenca_valor', OLD.diferenca_valor,
      'diferenca_dias', OLD.diferenca_dias,
      'observacoes', OLD.observacoes
    ),
    jsonb_build_object(
      'transacao_id', NEW.transacao_id,
      'titulo_id', NEW.titulo_id,
      'status', NEW.status,
      'diferenca_valor', NEW.diferenca_valor,
      'diferenca_dias', NEW.diferenca_dias,
      'observacoes', NEW.observacoes
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para registrar histórico ao atualizar
CREATE TRIGGER trigger_registrar_historico_edicao
  AFTER UPDATE ON conciliacoes
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_edicao();

-- =====================================================
-- 9. VIEWS ÚTEIS
-- =====================================================

-- View: Conciliações com detalhes completos
CREATE OR REPLACE VIEW vw_conciliacoes_detalhadas AS
SELECT 
  c.id,
  c.transacao_id,
  c.titulo_id,
  c.status,
  c.diferenca_valor,
  c.diferenca_dias,
  c.observacoes,
  c.usuario_id,
  c.data_conciliacao,
  c.created_at,
  c.updated_at,
  -- Dados da transação
  t.descricao AS transacao_descricao,
  t.valor AS transacao_valor,
  t.data AS transacao_data,
  t.tipo AS transacao_tipo,
  t.codigo_empresa AS transacao_empresa,
  -- Dados do título
  tit.descricao AS titulo_descricao,
  tit.valor AS titulo_valor,
  tit.data_vencimento AS titulo_vencimento,
  tit.tipo AS titulo_tipo,
  tit.codigo_empresa AS titulo_empresa,
  -- Dados do usuário
  u.email AS usuario_email
FROM conciliacoes c
JOIN transacoes t ON t.id = c.transacao_id
JOIN titulos tit ON tit.id = c.titulo_id
LEFT JOIN auth.users u ON u.id = c.usuario_id;

-- Comentário na view
COMMENT ON VIEW vw_conciliacoes_detalhadas IS 'View com detalhes completos das conciliações incluindo dados das transações e títulos';

-- =====================================================
-- 10. VERIFICAÇÕES E VALIDAÇÕES
-- =====================================================

-- Função: Validar se transação e título podem ser conciliados
CREATE OR REPLACE FUNCTION validar_conciliacao(
  p_transacao_id BIGINT,
  p_titulo_id BIGINT
)
RETURNS TABLE (
  valido BOOLEAN,
  mensagem TEXT
) AS $$
DECLARE
  v_transacao RECORD;
  v_titulo RECORD;
  v_ja_conciliada BOOLEAN;
  v_ja_conciliado BOOLEAN;
BEGIN
  -- Buscar transação
  SELECT * INTO v_transacao
  FROM transacoes
  WHERE id = p_transacao_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Transação não encontrada';
    RETURN;
  END IF;
  
  -- Buscar título
  SELECT * INTO v_titulo
  FROM titulos
  WHERE id = p_titulo_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Título não encontrado';
    RETURN;
  END IF;
  
  -- Verificar se transação já está conciliada
  SELECT EXISTS(
    SELECT 1 FROM conciliacoes
    WHERE transacao_id = p_transacao_id
  ) INTO v_ja_conciliada;
  
  IF v_ja_conciliada THEN
    RETURN QUERY SELECT false, 'Transação já está conciliada';
    RETURN;
  END IF;
  
  -- Verificar se título já está conciliado
  SELECT EXISTS(
    SELECT 1 FROM conciliacoes
    WHERE titulo_id = p_titulo_id
  ) INTO v_ja_conciliado;
  
  IF v_ja_conciliado THEN
    RETURN QUERY SELECT false, 'Título já está conciliado';
    RETURN;
  END IF;
  
  -- Verificar se são da mesma empresa
  IF v_transacao.codigo_empresa != v_titulo.codigo_empresa THEN
    RETURN QUERY SELECT false, 'Transação e título devem ser da mesma empresa';
    RETURN;
  END IF;
  
  -- Tudo válido
  RETURN QUERY SELECT true, 'Conciliação válida';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Para executar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Ctrl+Enter ou botão Run)
-- 
-- Verificações pós-execução:
-- SELECT * FROM conciliacoes LIMIT 1;
-- SELECT * FROM historico_conciliacoes LIMIT 1;
-- SELECT * FROM vw_conciliacoes_detalhadas LIMIT 1;
-- =====================================================
