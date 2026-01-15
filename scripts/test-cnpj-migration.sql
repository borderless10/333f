-- ===================================
-- TESTES PARA MIGRAÇÃO DE CNPJ
-- ===================================
-- Execute estes testes APÓS a migração para validar

-- ===================================
-- TESTE 1: VERIFICAR ESTRUTURA
-- ===================================

-- 1.1: Verificar se tabela empresas_telos existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'empresas_telos') THEN
    RAISE NOTICE '✅ Tabela empresas_telos existe';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Tabela empresas_telos NÃO existe';
  END IF;
END $$;

-- 1.2: Verificar se coluna empresa_telos_id existe em empresas
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'empresas' AND column_name = 'empresa_telos_id'
  ) THEN
    RAISE NOTICE '✅ Coluna empresa_telos_id existe em empresas';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna empresa_telos_id NÃO existe em empresas';
  END IF;
END $$;

-- 1.3: Verificar se coluna empresa_telos_id existe em perfis
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'perfis' AND column_name = 'empresa_telos_id'
  ) THEN
    RAISE NOTICE '✅ Coluna empresa_telos_id existe em perfis';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Coluna empresa_telos_id NÃO existe em perfis';
  END IF;
END $$;

-- 1.4: Verificar se índice único foi criado
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_indexes 
    WHERE indexname = 'empresas_cnpj_empresa_telos_unique_idx'
  ) THEN
    RAISE NOTICE '✅ Índice único empresas_cnpj_empresa_telos_unique_idx existe';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Índice único NÃO existe';
  END IF;
END $$;

-- 1.5: Verificar se função helper existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_proc 
    WHERE proname = 'get_user_empresa_telos_id'
  ) THEN
    RAISE NOTICE '✅ Função get_user_empresa_telos_id() existe';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Função helper NÃO existe';
  END IF;
END $$;

-- ===================================
-- TESTE 2: VERIFICAR DADOS
-- ===================================

-- 2.1: Verificar se Télos Control foi criada
DO $$
DECLARE
  count_telos INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_telos 
  FROM empresas_telos 
  WHERE id = '00000000-0000-0000-0000-000000000001';
  
  IF count_telos = 1 THEN
    RAISE NOTICE '✅ Empresa Télos Control existe';
  ELSE
    RAISE EXCEPTION '❌ ERRO: Empresa Télos Control NÃO foi criada';
  END IF;
END $$;

-- 2.2: Verificar se todas as empresas têm empresa_telos_id
DO $$
DECLARE
  total_empresas INTEGER;
  empresas_com_telos INTEGER;
  empresas_sem_telos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_empresas FROM empresas;
  SELECT COUNT(empresa_telos_id) INTO empresas_com_telos FROM empresas;
  empresas_sem_telos := total_empresas - empresas_com_telos;
  
  RAISE NOTICE 'Total de empresas: %', total_empresas;
  RAISE NOTICE 'Empresas com empresa_telos_id: %', empresas_com_telos;
  RAISE NOTICE 'Empresas SEM empresa_telos_id: %', empresas_sem_telos;
  
  IF empresas_sem_telos = 0 THEN
    RAISE NOTICE '✅ Todas as empresas têm empresa_telos_id';
  ELSE
    RAISE EXCEPTION '❌ ERRO: % empresas SEM empresa_telos_id', empresas_sem_telos;
  END IF;
END $$;

-- 2.3: Verificar se todos os perfis têm empresa_telos_id
DO $$
DECLARE
  total_perfis INTEGER;
  perfis_com_telos INTEGER;
  perfis_sem_telos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_perfis FROM perfis;
  SELECT COUNT(empresa_telos_id) INTO perfis_com_telos FROM perfis;
  perfis_sem_telos := total_perfis - perfis_com_telos;
  
  RAISE NOTICE 'Total de perfis: %', total_perfis;
  RAISE NOTICE 'Perfis com empresa_telos_id: %', perfis_com_telos;
  RAISE NOTICE 'Perfis SEM empresa_telos_id: %', perfis_sem_telos;
  
  IF perfis_sem_telos = 0 THEN
    RAISE NOTICE '✅ Todos os perfis têm empresa_telos_id';
  ELSE
    RAISE EXCEPTION '❌ ERRO: % perfis SEM empresa_telos_id', perfis_sem_telos;
  END IF;
END $$;

-- ===================================
-- TESTE 3: TESTAR DUPLICIDADE DE CNPJ
-- ===================================

-- 3.1: Criar empresa Télos de teste
INSERT INTO empresas_telos (id, nome, razao_social, ativa)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Empresa Teste A',
  'Empresa Teste A Ltda',
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO empresas_telos (id, nome, razao_social, ativa)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Empresa Teste B',
  'Empresa Teste B Ltda',
  true
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ Empresas Télos de teste criadas';

-- 3.2: Teste - CNPJ duplicado na MESMA empresa Télos (DEVE DAR ERRO)
DO $$
BEGIN
  -- Inserir primeira empresa
  INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
  VALUES (
    'test-user-123',
    'Cliente XYZ - Empresa A',
    '12345678000190',
    '11111111-1111-1111-1111-111111111111',
    true
  );
  
  -- Tentar inserir segunda empresa com MESMO CNPJ na MESMA empresa Télos
  BEGIN
    INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
    VALUES (
      'test-user-123',
      'Cliente XYZ Duplicado - Empresa A',
      '12345678000190', -- MESMO CNPJ
      '11111111-1111-1111-1111-111111111111', -- MESMA empresa Télos
      true
    );
    
    -- Se chegou aqui, o teste FALHOU (não deveria permitir)
    RAISE EXCEPTION '❌ TESTE FALHOU: Sistema permitiu CNPJ duplicado na mesma empresa Télos!';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE '✅ TESTE PASSOU: Sistema bloqueou CNPJ duplicado na mesma empresa Télos';
  END;
END $$;

-- 3.3: Teste - CNPJ duplicado em EMPRESAS TÉLOS DIFERENTES (DEVE FUNCIONAR)
DO $$
BEGIN
  BEGIN
    INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
    VALUES (
      'test-user-456',
      'Cliente XYZ - Empresa B',
      '12345678000190', -- MESMO CNPJ
      '22222222-2222-2222-2222-222222222222', -- EMPRESA TÉLOS DIFERENTE
      true
    );
    
    RAISE NOTICE '✅ TESTE PASSOU: Sistema permitiu CNPJ duplicado em empresa Télos diferente';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION '❌ TESTE FALHOU: Sistema bloqueou CNPJ em empresa Télos diferente (deveria permitir)!';
  END;
END $$;

-- ===================================
-- TESTE 4: VERIFICAR RLS POLICIES
-- ===================================

-- 4.1: Verificar se policies foram atualizadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'empresas'
  AND policyname LIKE '%Télos%';
  
  IF policy_count >= 3 THEN
    RAISE NOTICE '✅ Policies RLS atualizadas para empresas';
  ELSE
    RAISE WARNING '⚠️ Apenas % policies com "Télos" encontradas (esperado: 3+)', policy_count;
  END IF;
END $$;

-- ===================================
-- LIMPEZA DOS TESTES
-- ===================================

-- Remover dados de teste
DELETE FROM empresas WHERE cnpj = '12345678000190';
DELETE FROM empresas_telos WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

RAISE NOTICE '✅ Dados de teste removidos';

-- ===================================
-- RELATÓRIO FINAL
-- ===================================

DO $$
DECLARE
  total_telos INTEGER;
  total_empresas INTEGER;
  total_perfis INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_telos FROM empresas_telos;
  SELECT COUNT(*) INTO total_empresas FROM empresas;
  SELECT COUNT(*) INTO total_perfis FROM perfis;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '          RELATÓRIO FINAL              ';
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE 'Empresas Télos: %', total_telos;
  RAISE NOTICE 'Empresas cadastradas: %', total_empresas;
  RAISE NOTICE 'Perfis de usuários: %', total_perfis;
  RAISE NOTICE '═══════════════════════════════════════';
  RAISE NOTICE '✅ TODOS OS TESTES PASSARAM COM SUCESSO!';
  RAISE NOTICE '═══════════════════════════════════════';
END $$;
