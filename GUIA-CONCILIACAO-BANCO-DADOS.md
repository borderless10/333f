# 🗄️ Guia de Implementação - Banco de Dados de Conciliação

## 📋 Visão Geral

Este guia explica como configurar o banco de dados para o **Sistema de Conciliação Bancária**. O script SQL cria todas as tabelas, índices, políticas de segurança (RLS) e funções necessárias.

---

## ✅ O que será criado

### 1. **Tabela `conciliacoes`**
Armazena as conciliações entre transações bancárias e títulos ERP.

**Campos principais:**
- `id` - Identificador único
- `transacao_id` - Referência à transação bancária
- `titulo_id` - Referência ao título ERP
- `status` - `conciliado` ou `conciliado_com_diferenca`
- `diferenca_valor` - Diferença de valor (sempre positiva)
- `diferenca_dias` - Diferença em dias entre datas
- `observacoes` - Observações opcionais
- `usuario_id` - Usuário que realizou a conciliação
- `data_conciliacao` - Data/hora da conciliação

**Constraints:**
- Uma transação só pode ser conciliada com um título (único)
- Um título só pode ser conciliado com uma transação (único)

### 2. **Tabela `historico_conciliacoes`**
Armazena o histórico completo de todas as ações nas conciliações.

**Campos principais:**
- `id` - Identificador único
- `conciliacao_id` - Referência à conciliação
- `acao` - `criada`, `desfeita` ou `editada`
- `usuario_id` - Usuário que realizou a ação
- `data_acao` - Data/hora da ação
- `dados_anteriores` - Dados antes da ação (JSONB)
- `dados_novos` - Dados após a ação (JSONB)

### 3. **Índices para Performance**
- Índices em todas as colunas de busca frequente
- Índices compostos para queries complexas
- Otimização para buscas por status e data

### 4. **Row Level Security (RLS)**
- Políticas de segurança configuradas
- Usuários só veem conciliações de suas empresas
- Admins têm acesso completo

### 5. **Funções e Triggers**
- **Triggers automáticos** para registrar histórico
- **Função de validação** antes de criar conciliação
- **View detalhada** com dados completos

---

## 🚀 Como Executar

### Passo 1: Acessar Supabase Dashboard

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### Passo 2: Abrir SQL Editor

1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova query

### Passo 3: Executar o Script

1. Abra o arquivo `scripts/reconciliation-setup.sql`
2. **Copie todo o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl+Enter`)

### Passo 4: Verificar Execução

O script deve executar sem erros. Você verá mensagens como:
- `CREATE TABLE`
- `CREATE INDEX`
- `CREATE POLICY`
- `CREATE FUNCTION`

---

## ✅ Verificações Pós-Instalação

Execute estas queries no SQL Editor para verificar se tudo foi criado corretamente:

### 1. Verificar Tabelas Criadas

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conciliacoes', 'historico_conciliacoes');
```

**Resultado esperado:** 2 linhas (conciliacoes, historico_conciliacoes)

### 2. Verificar Índices

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('conciliacoes', 'historico_conciliacoes')
ORDER BY tablename, indexname;
```

**Resultado esperado:** Múltiplos índices criados

### 3. Verificar RLS Habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('conciliacoes', 'historico_conciliacoes');
```

**Resultado esperado:** `rowsecurity = true` para ambas as tabelas

### 4. Verificar Políticas RLS

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('conciliacoes', 'historico_conciliacoes');
```

**Resultado esperado:** Múltiplas políticas criadas

### 5. Verificar Funções

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%conciliacao%';
```

**Resultado esperado:** Funções de validação e triggers

### 6. Verificar View

```sql
SELECT * FROM vw_conciliacoes_detalhadas LIMIT 1;
```

**Resultado esperado:** Query executada sem erros (mesmo que retorne 0 linhas)

---

## 🔍 Estrutura Detalhada

### Tabela `conciliacoes`

```sql
CREATE TABLE conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  transacao_id BIGINT NOT NULL REFERENCES transacoes(id),
  titulo_id BIGINT NOT NULL REFERENCES titulos(id),
  status TEXT NOT NULL CHECK (status IN ('conciliado', 'conciliado_com_diferenca')),
  diferenca_valor DECIMAL(15, 2) DEFAULT 0,
  diferenca_dias INTEGER DEFAULT 0,
  observacoes TEXT,
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  data_conciliacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_transacao_conciliacao UNIQUE (transacao_id),
  CONSTRAINT unique_titulo_conciliacao UNIQUE (titulo_id)
);
```

### Tabela `historico_conciliacoes`

```sql
CREATE TABLE historico_conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  conciliacao_id BIGINT NOT NULL REFERENCES conciliacoes(id),
  acao TEXT NOT NULL CHECK (acao IN ('criada', 'desfeita', 'editada')),
  usuario_id UUID NOT NULL REFERENCES auth.users(id),
  data_acao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dados_anteriores JSONB,
  dados_novos JSONB,
  observacoes TEXT
);
```

---

## 🔐 Segurança (RLS)

### Políticas Implementadas

1. **SELECT**: Usuários veem apenas conciliações de suas empresas
2. **INSERT**: Usuários podem criar conciliações para suas empresas
3. **UPDATE**: Usuários podem atualizar conciliações de suas empresas
4. **DELETE**: Usuários podem deletar conciliações de suas empresas
5. **Admin**: Admins têm acesso completo a todas as conciliações

### Como Funciona

- O RLS verifica se a transação pertence ao usuário (`codigo_empresa = auth.uid()::text`)
- Admins têm acesso completo através da verificação de perfil
- Todas as políticas são aplicadas automaticamente pelo PostgreSQL

---

## 🎯 Próximos Passos

Após executar este script com sucesso:

1. ✅ **Banco de Dados** - COMPLETO (você está aqui)
2. ⏳ **Serviço de Conciliação** - Próximo passo
   - Criar `lib/services/reconciliation.ts`
   - Implementar funções de busca, matching e conciliação
3. ⏳ **Tela de Conciliação** - Depois
   - Criar `app/(tabs)/reconciliation.tsx`
   - Layout duas colunas
   - Cards interativos

---

## 🐛 Troubleshooting

### Erro: "relation already exists"

**Solução:**** O script usa `CREATE TABLE IF NOT EXISTS`, então não deve dar erro. Se der, significa que as tabelas já existem. Você pode:
- Deletar as tabelas manualmente e executar novamente
- Ou continuar (as tabelas já estão criadas)

### Erro: "permission denied"

**Solução:**** Verifique se você está logado como admin no Supabase e tem permissões para criar tabelas.

### Erro: "foreign key constraint"

**Solução:**** Verifique se as tabelas `transacoes` e `titulos` existem. Execute primeiro o script `supabase-setup.sql` se ainda não executou.

### Erro: "function already exists"

**Solução:**** O script usa `CREATE OR REPLACE FUNCTION`, então deve atualizar automaticamente. Se persistir, pode ser um problema de sintaxe.

---

## 📝 Notas Importantes

1. **Backup**: Sempre faça backup antes de executar scripts SQL em produção
2. **Teste**: Teste primeiro em ambiente de desenvolvimento
3. **Dados**: Este script não deleta dados existentes
4. **Performance**: Os índices são criados automaticamente para otimizar queries
5. **Histórico**: O histórico é registrado automaticamente via triggers

---

## ✅ Checklist de Instalação

- [ ] Script SQL copiado para o Supabase
- [ ] Script executado sem erros
- [ ] Tabelas `conciliacoes` e `historico_conciliacoes` criadas
- [ ] Índices criados corretamente
- [ ] RLS habilitado e políticas criadas
- [ ] Funções e triggers criados
- [ ] View `vw_conciliacoes_detalhadas` criada
- [ ] Verificações pós-instalação executadas com sucesso

---

**Status:** ✅ Script pronto para execução  
**Tempo estimado:** 2-3 minutos  
**Próximo passo:** Criar serviço de conciliação (`lib/services/reconciliation.ts`)

---

**Documento criado em:** 2026-01-XX  
**Versão:** 1.0
