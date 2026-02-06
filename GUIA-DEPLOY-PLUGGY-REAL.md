# Guia: Deploy da Integração Real com Pluggy

Este guia mostra como fazer deploy das novas Edge Functions para buscar transações e saldo reais da API Pluggy.

---

## Passo 1: Executar script SQL no Supabase

### 1.1 Adicionar campo `bank_transaction_id` na tabela transações

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Abra seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `scripts/add-bank-transaction-id.sql`:

```sql
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
```

6. Clique em **Run** para executar
7. Verifique se apareceu **Success** sem erros

---

## Passo 2: Deploy das Edge Functions

### 2.1 Instalar Supabase CLI (se ainda não tiver)

```bash
npm install -g supabase
```

### 2.2 Login no Supabase

```bash
supabase login
```

Isso abrirá o navegador para autenticar. Siga as instruções.

### 2.3 Linkar com seu projeto

```bash
supabase link --project-ref SEU_PROJECT_REF
```

**Como encontrar o `PROJECT_REF`:**
- No Supabase Dashboard, vá em **Project Settings** (ícone de engrenagem)
- Em **General**, copie o **Reference ID** (ex.: `wqqxyupgndcpetqzudez`)

### 2.4 Deploy da função `pluggy-transactions`

```bash
supabase functions deploy pluggy-transactions
```

### 2.5 Deploy da função `pluggy-accounts`

```bash
supabase functions deploy pluggy-accounts
```

### 2.6 Verificar se as funções foram deployadas

1. No Supabase Dashboard, vá em **Edge Functions**
2. Você deve ver as 3 funções:
   - `pluggy-connect-token` (já existia)
   - `pluggy-transactions` (nova)
   - `pluggy-accounts` (nova)

---

## Passo 3: Verificar Secrets

As novas funções usam os mesmos secrets da função `pluggy-connect-token`:

- `PLUGGY_CLIENT_ID`
- `PLUGGY_CLIENT_SECRET`

Se você já configurou esses secrets para a função `pluggy-connect-token`, eles estarão disponíveis automaticamente para as novas funções.

**Para verificar:**

1. No Supabase Dashboard, vá em **Project Settings** → **Edge Functions**
2. Clique na aba **Secrets**
3. Confirme que `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` estão configurados

---

## Passo 4: Testar a integração no app

### 4.1 Reiniciar o app

```bash
npx expo start
```

### 4.2 Conectar uma conta bancária

1. No app, vá em **Conexões**
2. Clique em **+** → **Conectar Conta**
3. Conecte uma conta bancária (Pluggy)
4. Após conectar, a conexão deve aparecer na lista com status **"Ativa"**

### 4.3 Importar transações

1. Na conexão que você criou, toque em **Importar Transações**
2. O app vai buscar transações reais dos últimos 90 dias via API Pluggy
3. Você deve ver uma mensagem de sucesso com o número de transações importadas
4. Se já importou antes, verá quantas foram duplicadas e ignoradas

### 4.4 Importar saldo

1. Na mesma conexão, toque em **Importar Saldo**
2. O app vai buscar o saldo real da conta via API Pluggy
3. Você deve ver uma mensagem com o saldo importado

---

## Passo 5: Verificar transações importadas

1. Vá na aba **Transações**
2. Você deve ver as transações importadas com:
   - Descrição real do banco
   - Valor correto
   - Data correta
   - Categoria "Importado do Banco" (se não veio categoria da Pluggy)

---

## Solução de Problemas

### Erro: "Credenciais Pluggy não configuradas"

**Causa:** Secrets `PLUGGY_CLIENT_ID` e/ou `PLUGGY_CLIENT_SECRET` não estão configurados.

**Solução:** Configure os secrets conforme **Passo 3** acima.

### Erro: "itemId é obrigatório"

**Causa:** A conexão não tem `pluggy_item_id` salvo.

**Solução:** Essa é uma conexão antiga. Revogue-a e crie uma nova conexão via Pluggy Connect.

### Nenhuma transação encontrada

**Causa:** A conta pode não ter transações nos últimos 90 dias, ou o banco pode não fornecer transações via API.

**Solução:** Normal para contas sem movimento. Teste com outra conta ou banco.

### Erro 502 ao importar transações/saldo

**Causa:** Falha na comunicação com a API Pluggy (pode ser token expirado, banco indisponível, etc.).

**Solução:** 
1. Verifique se a conexão está **Ativa** (não expirada)
2. Se expirada, revogue e reconecte
3. Verifique os logs da Edge Function no Supabase Dashboard → **Edge Functions** → selecione a função → **Logs**

### Transações duplicadas mesmo com verificação

**Causa:** O script SQL não foi executado ou a coluna `bank_transaction_id` não existe.

**Solução:** Execute o script SQL do **Passo 1** novamente.

---

## Alterações Realizadas

### Arquivos Novos

1. **`supabase/functions/pluggy-transactions/index.ts`**
   - Edge Function para buscar transações via API Pluggy
   - Parâmetros: `itemId`, `accountId` (opcional), `from`, `to`, `pageSize`
   - Retorna: `{ transactions, total, page, totalPages }`

2. **`supabase/functions/pluggy-accounts/index.ts`**
   - Edge Function para buscar contas e saldo via API Pluggy
   - Parâmetros: `itemId`
   - Retorna: `{ accounts, total }`

3. **`scripts/add-bank-transaction-id.sql`**
   - Adiciona coluna `bank_transaction_id` na tabela `transacoes`
   - Cria índice único para evitar duplicatas

### Arquivos Modificados

1. **`lib/services/pluggy.ts`**
   - Adicionadas interfaces: `PluggyTransaction`, `PluggyAccount`
   - Adicionadas funções: `getPluggyTransactions()`, `getPluggyAccounts()`

2. **`lib/services/transactions.ts`**
   - Interface `Transaction` agora inclui `bank_transaction_id?: string | null`

3. **`lib/services/open-finance.ts`**
   - Função `importTransactions()` agora:
     - Verifica duplicatas por `bank_transaction_id`
     - Verifica duplicatas por valor+data+descrição (fallback)
     - Salva `bank_transaction_id` na transação
     - Retorna `{ imported, errors, duplicates }`

4. **`app/(tabs)/bank-connections.tsx`**
   - `handleImportTransactions()` agora:
     - Chama `getPluggyTransactions()` para buscar transações reais
     - Busca últimos 90 dias (configurável)
     - Converte formato Pluggy → formato do sistema
     - Mostra mensagens separadas para importadas/duplicadas/erro
   - `handleImportBalance()` agora:
     - Chama `getPluggyAccounts()` para buscar contas e saldo real
     - Soma saldo de todas as contas se houver múltiplas
     - Mostra nome da conta e saldo no feedback

---

## Próximos Passos (Opcionais)

1. **Renovação automática de tokens** (Sprint 1.3 - 3h)
   - Verificar `expires_at` antes de importar
   - Renovar token automaticamente se expirado

2. **Configurar período de importação** (melhoria)
   - Adicionar seletor de período (ex: últimos 30, 60, 90 dias) na UI
   - Passar para `getPluggyTransactions()`

3. **Importação incremental** (otimização)
   - Salvar `last_sync_at` com data da última transação importada
   - Na próxima importação, buscar apenas transações após essa data

---

**Última atualização:** 06/02/2026  
**Versão:** 1.0  
**Status:** ✅ Implementado e pronto para teste
