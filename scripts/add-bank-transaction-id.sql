-- Adiciona campo bank_transaction_id para rastrear transações importadas do banco
-- e evitar duplicatas na importação

-- 1. Adicionar coluna bank_transaction_id (se não existir)
ALTER TABLE public.transacoes
ADD COLUMN IF NOT EXISTS bank_transaction_id TEXT;

-- 2. Adicionar índice único para evitar duplicatas (permite NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_bank_transaction_id
  ON public.transacoes (bank_transaction_id)
  WHERE bank_transaction_id IS NOT NULL;

-- 3. Adicionar comentário explicativo
COMMENT ON COLUMN public.transacoes.bank_transaction_id IS 
  'ID da transação no banco/Pluggy - usado para evitar duplicatas na importação';
