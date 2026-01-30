-- =====================================================
-- Migração: coluna pluggy_item_id para bank_connections
-- =====================================================
-- Execute no Supabase → SQL Editor
-- Permite guardar o itemId retornado pela Pluggy após conexão
-- =====================================================

ALTER TABLE bank_connections
ADD COLUMN IF NOT EXISTS pluggy_item_id TEXT;

COMMENT ON COLUMN bank_connections.pluggy_item_id IS 'Item ID retornado pela Pluggy ao conectar a conta (usado para buscar contas/transações via API)';

-- =====================================================
-- FIM
-- =====================================================
