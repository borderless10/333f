# ✅ Checklist de Deploy - Sprint 1 Pluggy Real

## 🎯 O que foi implementado

✅ Integração real de transações via API Pluggy  
✅ Integração real de saldo via API Pluggy  
✅ Tratamento automático de duplicatas  
✅ 2 Edge Functions novas no Supabase  
✅ Script SQL para adicionar campo `bank_transaction_id`  

---

## 📋 Passos para Deploy (em ordem)

### 1️⃣ Executar Script SQL no Supabase (5 minutos)

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Abra o arquivo `scripts/add-bank-transaction-id.sql` e copie todo o conteúdo
6. Cole no editor SQL
7. Clique em **Run**
8. Verifique se apareceu **Success** ✅

**O que esse script faz:**
- Adiciona coluna `bank_transaction_id` na tabela `transacoes`
- Cria índice único para evitar duplicatas
- É seguro rodar múltiplas vezes (usa `IF NOT EXISTS`)

---

### 2️⃣ Fazer Deploy das Edge Functions (10–15 minutos)

#### ⭐ Opção A: Pelo Dashboard (SEM instalar CLI) – use se `supabase` não for reconhecido

**Guia completo:** leia o arquivo **`DEPLOY-SEM-CLI.md`** na raiz do projeto.

Resumo:
1. Acesse **Supabase Dashboard** → **Edge Functions**
2. **Deploy a new function** → **Via Editor**
3. Nome: `pluggy-transactions` → apague o template → copie todo o conteúdo de `supabase/functions/pluggy-transactions/index.ts` → cole → **Deploy function**
4. Repita para `pluggy-accounts` (código em `supabase/functions/pluggy-accounts/index.ts`)

Não precisa instalar nada no PC.

#### Opção B: Via Supabase CLI (se já tiver instalado)

```bash
# Se o comando supabase não for reconhecido, use npx (uma vez por comando):
npx supabase login
npx supabase link --project-ref wqqxyupgndcpetqzudez
npx supabase functions deploy pluggy-transactions
npx supabase functions deploy pluggy-accounts
```

Ou, com CLI instalado globalmente (`npm install -g supabase`):

```bash
supabase login
supabase link --project-ref wqqxyupgndcpetqzudez
supabase functions deploy pluggy-transactions
supabase functions deploy pluggy-accounts
```

**Como encontrar o PROJECT_REF:** Dashboard → **Project Settings** → **General** → **Reference ID**

---

### 3️⃣ Verificar Secrets (2 minutos)

1. No Supabase Dashboard, vá em **Project Settings** → **Edge Functions**
2. Clique na aba **Secrets**
3. Confirme que existem:
   - ✅ `PLUGGY_CLIENT_ID` (com valor de Produção)
   - ✅ `PLUGGY_CLIENT_SECRET` (com valor de Produção)

**Se não existirem:**
- Siga o guia `GUIA-MIGRACAO-PLUGGY-PREMIUM.md` para configurar

**Importante:**
- Os secrets são compartilhados entre todas as Edge Functions
- Se já configurou para `pluggy-connect-token`, já estão disponíveis

---

### 4️⃣ Testar no App (15 minutos)

#### Passo 1: Reiniciar o app
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente
npx expo start
```

#### Passo 2: Conectar uma conta bancária
1. No app, vá em **Conexões**
2. Toque em **+** (canto superior direito)
3. Toque em **Conectar Conta**
4. Siga o fluxo do Pluggy Connect:
   - Escolha um banco (ex: Nubank, Itaú, Bradesco)
   - Faça login com suas credenciais do banco
   - Autorize o acesso
5. Aguarde a conexão aparecer na lista com status **"Ativa"** ✅

#### Passo 3: Importar transações (primeira vez)
1. Na conexão que você criou, toque no botão **"Importar Transações"**
2. Aguarde o loading (pode levar 5-15 segundos)
3. Você deve ver:
   - ✅ Mensagem: "X transações importadas com sucesso!"
   - Se não houver transações: "Nenhuma transação encontrada no período"

#### Passo 4: Verificar transações importadas
1. Vá na aba **Transações**
2. Você deve ver as transações reais do banco:
   - Descrição real (ex: "Compra Supermercado XYZ")
   - Valor correto
   - Data correta
   - Categoria: "Importado do Banco" (se não veio categoria)

#### Passo 5: Testar duplicatas (segunda vez)
1. Volte em **Conexões**
2. Na mesma conexão, toque novamente em **"Importar Transações"**
3. Você deve ver:
   - ✅ "X transações já existem e foram ignoradas"
   - ✅ "0 transações importadas" (se todas já existiam)
4. Confirme que não há duplicatas na lista de transações

#### Passo 6: Importar saldo
1. Na conexão, toque no botão **"Importar Saldo"**
2. Você deve ver:
   - ✅ Mensagem com o saldo real da conta
   - Ex: "Conta Corrente: R$ 1.234,56"
   - Se múltiplas contas: "3 contas, saldo total: R$ 5.678,90"

---

## 🐛 Solução de Problemas

### ❌ Erro: "Credenciais Pluggy não configuradas"

**Causa:** Secrets não estão configurados no Supabase.

**Solução:**
1. Vá em **Project Settings** → **Edge Functions** → **Secrets**
2. Configure `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`
3. Use valores de **Produção** (não Sandbox)
4. Siga `GUIA-MIGRACAO-PLUGGY-PREMIUM.md` se necessário

---

### ❌ Erro: "itemId é obrigatório"

**Causa:** Conexão antiga sem `pluggy_item_id`.

**Solução:**
1. Delete a conexão antiga (botão de revogação)
2. Crie uma nova conexão via Pluggy Connect
3. A nova conexão terá `pluggy_item_id` automaticamente

---

### ❌ Erro: "Falha ao buscar transações" (502)

**Causa:** Problema na comunicação com API Pluggy.

**Solução:**
1. Verifique se a conexão está **Ativa** (não expirada)
2. Se expirada, revogue e reconecte
3. Verifique os logs no Supabase:
   - Dashboard → **Edge Functions** → **pluggy-transactions** → **Logs**
4. Procure por erros de autenticação ou timeout

---

### ❌ Nenhuma transação encontrada

**Causa:** Conta pode não ter transações nos últimos 90 dias, ou banco não fornece via API.

**Solução:**
- Normal para contas sem movimento recente
- Teste com outra conta ou banco
- Bancos digitais (Nubank, Inter, C6) geralmente funcionam melhor

---

### ❌ Transações duplicadas mesmo com verificação

**Causa:** Script SQL não foi executado.

**Solução:**
1. Execute o script `scripts/add-bank-transaction-id.sql` no Supabase
2. Delete as transações duplicadas manualmente (opcional)
3. Reimporte as transações

---

### ❌ Edge Function não aparece no dashboard

**Causa:** Deploy falhou ou projeto não está linkado.

**Solução:**
```bash
# Verificar se está linkado ao projeto correto
supabase projects list

# Linkar novamente
supabase link --project-ref SEU_PROJECT_REF

# Tentar deploy novamente
supabase functions deploy pluggy-transactions
supabase functions deploy pluggy-accounts
```

---

## 📊 Métricas de Sucesso

Após o deploy, você deve conseguir:

- ✅ Conectar conta bancária via Pluggy
- ✅ Importar transações reais dos últimos 90 dias
- ✅ Ver descrições, valores e datas reais na aba Transações
- ✅ Importar saldo real da conta
- ✅ Reimportar sem criar duplicatas
- ✅ Ver feedback detalhado (importadas/duplicadas/erros)

---

## 📁 Arquivos para Deploy

**Novos:**
- ✅ `supabase/functions/pluggy-transactions/index.ts`
- ✅ `supabase/functions/pluggy-accounts/index.ts`
- ✅ `scripts/add-bank-transaction-id.sql`

**Modificados (já estão no código):**
- ✅ `lib/services/pluggy.ts`
- ✅ `lib/services/transactions.ts`
- ✅ `lib/services/open-finance.ts`
- ✅ `app/(tabs)/bank-connections.tsx`

**Documentação:**
- 📖 `GUIA-DEPLOY-PLUGGY-REAL.md` (guia completo)
- 📖 `IMPLEMENTACAO-SPRINT-1-RESUMO.md` (resumo técnico)
- 📋 `DEPLOY-CHECKLIST.md` (este arquivo)

---

## ⏱️ Tempo Estimado Total

| Etapa | Tempo |
|-------|-------|
| Executar SQL | 5 min |
| Deploy Edge Functions | 10 min |
| Verificar Secrets | 2 min |
| Teste completo | 15 min |
| **TOTAL** | **~32 min** |

---

## 🎉 Após o Deploy

1. ✅ Marque no `PROXIMOS-PASSOS-IMPLEMENTACAO.md`:
   - Sprint 1.1 (Integração transações) - Concluído
   - Sprint 1.2 (Integração saldo) - Concluído
   - Sprint 1.4 (Tratamento duplicatas) - Concluído

2. 🧪 Teste com dados reais de diferentes bancos

3. 📊 Monitore os logs das Edge Functions para erros

4. 🚀 Próximo passo: Sprint 1.3 (Renovação automática de tokens) ou Sprint 4 (Multiusuário)

---

**Última atualização:** 06/02/2026  
**Status:** ✅ Pronto para deploy  
**Dúvidas?** Consulte `GUIA-DEPLOY-PLUGGY-REAL.md` para detalhes técnicos
