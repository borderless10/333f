# 🔧 DEBUG - Loading Infinito

## 🎯 CORREÇÕES APLICADAS

### Arquivos Modificados:
1. ✅ `app/(tabs)/transactions.tsx` - Logs de debug + garantir setLoading(false)
2. ✅ `app/(tabs)/companies.tsx` - Logs de debug + garantir setLoading(false)
3. ✅ `app/(tabs)/titles.tsx` - Logs de debug + garantir setLoading(false)
4. ✅ `contexts/AuthContext.tsx` - roleLoading sempre finaliza

---

## 🧪 COMO DEBUGAR

### 1. Abrir console do Expo:
```bash
# Iniciar com logs
npx expo start -c

# Aguardar iniciar
# Pressionar 'j' para abrir debugger
```

### 2. No celular/emulador:
```
1. Shake no celular
2. Clicar em "Debug Remote JS"
3. OU conectar DevTools
```

### 3. Verificar logs:
```
Você verá logs como:
📊 Transações: Carregando dados para userId: xxx
✅ Transações carregadas: 5
❌ Erro ao buscar transações: (se houver erro)
```

---

## 🔍 O QUE PROCURAR NOS LOGS

### Se aparecer:
```
📊 Transações: Aguardando userId...
```
**Problema**: userId não está sendo passado  
**Solução**: Verificar AuthContext

### Se aparecer:
```
📊 Transações: Carregando dados para userId: xxx
❌ Erro ao buscar transações: ...
```
**Problema**: Query falhando (provavelmente RLS)  
**Solução**: Verificar RLS policies no Supabase

### Se aparecer:
```
📊 Transações: Carregando dados para userId: xxx
(e depois nada)
```
**Problema**: Query travada/timeout  
**Solução**: Verificar conexão Supabase

---

## ⚠️ POSSÍVEIS CAUSAS

### 1. Perfil não existe no banco:
```sql
-- Execute no Supabase SQL Editor:
SELECT * FROM perfis WHERE usuario_id = auth.uid();

-- Se vazio, crie:
INSERT INTO perfis (usuario_id, role, empresa_telos_id)
VALUES (
  auth.uid(), 
  'admin',
  '00000000-0000-0000-0000-000000000001'
);
```

### 2. Tabela contas_bancarias não existe:
```sql
-- Verificar:
SELECT * FROM contas_bancarias LIMIT 1;

-- Se der erro, criar tabela:
CREATE TABLE IF NOT EXISTS contas_bancarias (
  id BIGSERIAL PRIMARY KEY,
  codigo_conta_banco INT NOT NULL,
  codigo_empresa UUID NOT NULL REFERENCES auth.users(id),
  codigo_banco INT NOT NULL,
  codigo_agencia INT NOT NULL,
  descricao VARCHAR(40) NOT NULL,
  numero_conta VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias contas"
  ON contas_bancarias FOR SELECT
  USING (auth.uid() = codigo_empresa);

CREATE POLICY "Usuários podem criar suas próprias contas"
  ON contas_bancarias FOR INSERT
  WITH CHECK (auth.uid() = codigo_empresa);
```

### 3. RLS bloqueando queries:
```sql
-- Verificar policies:
SELECT * FROM pg_policies WHERE tablename = 'transacoes';
SELECT * FROM pg_policies WHERE tablename = 'empresas';
SELECT * FROM pg_policies WHERE tablename = 'titulos';

-- Se não tiver policies, executar:
-- scripts/supabase-setup.sql completo
```

---

## 🚀 TESTE COM LOGS

```bash
# 1. Parar servidor (Ctrl+C)

# 2. Limpar TUDO
Remove-Item .expo -Recurse -Force
npx expo start -c

# 3. Abrir app e ver console

# 4. Clicar em Transações

# 5. VER LOGS NO TERMINAL:
# Deve aparecer:
# 📊 Transações: Carregando dados...
# ✅ Transações carregadas: X
```

---

## ✅ SE OS LOGS MOSTRAREM

### "✅ Transações carregadas: 0"
**Significa**: Query funciona mas não há dados  
**Ação**: Criar dados de teste

### "❌ Erro ao buscar transações: RLS"
**Significa**: RLS bloqueando  
**Ação**: Executar scripts/supabase-setup.sql

### "📊 Aguardando userId..."
**Significa**: AuthContext não está passando userId  
**Ação**: Verificar se está logado (fazer logout e login novamente)

### Nenhum log aparece:
**Significa**: useEffect não está rodando  
**Ação**: Problema de navegação/montagem do componente

---

## 🔧 SOLUÇÃO RÁPIDA

Execute no terminal do Expo (depois de `npm start`):

```bash
# Ver todos os logs
# Pressione 'j' para abrir Chrome DevTools
# Vá em Console tab
# Filtre por: "Transações" ou "Empresas" ou "Títulos"
```

---

## 📊 CHECKLIST DE DEBUG

- [ ] Console do Expo aberto
- [ ] DevTools conectado (pressione 'j')
- [ ] Clicar em cada tab e ver logs:
  - [ ] Dashboard → Funciona (baseline)
  - [ ] Transações → Ver logs
  - [ ] Contas → Ver logs
  - [ ] Empresas → Ver logs
  - [ ] Títulos → Ver logs
  - [ ] Perfil → Funciona (baseline)

---

## 🎯 PRÓXIMOS PASSOS

1. Execute `npx expo start -c`
2. Abra DevTools (pressione 'j')
3. Clique em Transações
4. **Me envie os logs que aparecem no console**
5. Com os logs, poderei identificar exatamente o problema

---

**Status**: ✅ Logs de debug adicionados  
**Próximo**: Executar e ver console  
**Objetivo**: Identificar onde está travando  

---

**Implementado em**: 15/01/2026  
**Arquivos modificados**: 4  
**Logs adicionados**: ✅  
**Pronto para debug**: ✅  
