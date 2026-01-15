  # 🔧 GUIA DE MIGRAÇÃO - CORREÇÃO DUPLICIDADE DE CNPJ

## 📋 Visão Geral

Esta migração corrige a regra de duplicidade de CNPJ para permitir que o mesmo CNPJ seja cadastrado em empresas Télos diferentes (ex: Télos Control, Empresa Y, etc).

**Antes**: CNPJ único globalmente (não podia repetir em lugar nenhum)  
**Depois**: CNPJ único apenas dentro da mesma empresa Télos

---

## ⚙️ PASSO A PASSO PARA EXECUTAR A MIGRAÇÃO

### 1️⃣ **Backup do Banco de Dados** (CRÍTICO)

Antes de executar qualquer migração, faça backup do banco:

1. Acesse o Supabase Dashboard
2. Vá em **Database** > **Backups**
3. Clique em **Create Backup**
4. Aguarde a conclusão

---

### 2️⃣ **Executar Script de Migração**

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **+ New Query**
4. Abra o arquivo `scripts/migration-cnpj-fix.sql`
5. Copie **TODO** o conteúdo
6. Cole no SQL Editor
7. Clique em **Run** (ou pressione Ctrl+Enter)

**⏱️ Tempo estimado**: 2-5 segundos

---

### 3️⃣ **Verificar se Migração Foi Bem-Sucedida**

Execute estas queries no SQL Editor para verificar:

```sql
-- 1. Verificar se tabela empresas_telos foi criada
SELECT * FROM empresas_telos;
-- Deve retornar pelo menos 1 linha (Télos Control)

-- 2. Verificar se todas as empresas têm empresa_telos_id
SELECT 
  COUNT(*) as total_empresas, 
  COUNT(empresa_telos_id) as empresas_com_telos,
  COUNT(*) - COUNT(empresa_telos_id) as empresas_sem_telos
FROM empresas;
-- empresas_sem_telos deve ser 0

-- 3. Verificar se todos os perfis têm empresa_telos_id
SELECT 
  COUNT(*) as total_perfis, 
  COUNT(empresa_telos_id) as perfis_com_telos,
  COUNT(*) - COUNT(empresa_telos_id) as perfis_sem_telos
FROM perfis;
-- perfis_sem_telos deve ser 0

-- 4. Verificar índice único
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'empresas' 
AND indexname LIKE '%cnpj%';
-- Deve aparecer: empresas_cnpj_empresa_telos_unique_idx

-- 5. Verificar função helper
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_user_empresa_telos_id';
-- Deve retornar 1 linha
```

✅ **Se todas as queries retornaram resultados esperados, a migração foi bem-sucedida!**

---

### 4️⃣ **Testar Duplicidade de CNPJ**

Execute estes testes para garantir que a nova regra está funcionando:

```sql
-- Teste 1: Tentar criar empresa com CNPJ duplicado NA MESMA empresa Télos
-- Isso DEVE dar ERRO
INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
VALUES (
  'seu-user-id-aqui',
  'Teste Duplicado',
  '12345678000190',
  '00000000-0000-0000-0000-000000000001',
  true
);
-- Execute 2 vezes seguidas
-- A segunda execução DEVE retornar erro de CNPJ duplicado

-- Limpar teste
DELETE FROM empresas WHERE razao_social = 'Teste Duplicado';
```

```sql
-- Teste 2: Criar empresa com mesmo CNPJ em OUTRA empresa Télos
-- Isso DEVE FUNCIONAR (sem erro)

-- Primeiro criar outra empresa Télos para teste
INSERT INTO empresas_telos (id, nome, razao_social, ativa)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Empresa Y',
  'Empresa Y Ltda',
  true
);

-- Agora criar empresas com mesmo CNPJ em empresas Télos diferentes
INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
VALUES (
  'seu-user-id-aqui',
  'Cliente ABC - Télos Control',
  '99999999000199',
  '00000000-0000-0000-0000-000000000001', -- Télos Control
  true
);

INSERT INTO empresas (codigo_empresa, razao_social, cnpj, empresa_telos_id, ativa)
VALUES (
  'seu-user-id-aqui',
  'Cliente ABC - Empresa Y',
  '99999999000199', -- MESMO CNPJ
  '00000000-0000-0000-0000-000000000002', -- Empresa Y (diferente)
  true
);

-- Ambas inserções DEVEM funcionar!
-- Verificar
SELECT razao_social, cnpj, empresa_telos_id FROM empresas WHERE cnpj = '99999999000199';
-- Deve retornar 2 linhas com mesmo CNPJ mas empresa_telos_id diferentes

-- Limpar teste
DELETE FROM empresas WHERE cnpj = '99999999000199';
DELETE FROM empresas_telos WHERE id = '00000000-0000-0000-0000-000000000002';
```

✅ **Se os testes funcionaram conforme esperado, a nova regra está ativa!**

---

### 5️⃣ **Testar no App React Native**

1. Abra o app
2. Faça login
3. Vá em **Empresas**
4. Tente adicionar uma empresa com um CNPJ que já existe
5. **Deve retornar erro**: "Este CNPJ já está cadastrado na sua empresa"
6. A mensagem mudou de "Este CNPJ já está cadastrado" para "...na sua empresa" ✅

---

## 🔄 ROLLBACK (Se Algo Der Errado)

⚠️ **APENAS execute se precisar desfazer a migração**

```sql
-- Remover índice único composto
DROP INDEX IF EXISTS empresas_cnpj_empresa_telos_unique_idx;

-- Remover colunas empresa_telos_id
ALTER TABLE empresas DROP COLUMN IF EXISTS empresa_telos_id;
ALTER TABLE perfis DROP COLUMN IF EXISTS empresa_telos_id;

-- Remover tabela empresas_telos
DROP TABLE IF EXISTS empresas_telos CASCADE;

-- Remover função helper
DROP FUNCTION IF EXISTS get_user_empresa_telos_id();

-- Restaurar constraint única de CNPJ (comportamento antigo)
ALTER TABLE empresas ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);
```

Após executar o rollback, restaure o backup do banco de dados.

---

## 📊 IMPACTO DA MIGRAÇÃO

### O que muda para o usuário:
- **Nada visualmente** (funciona igual)
- **Validação de CNPJ** agora considera apenas sua empresa
- **Permite CNPJs duplicados** entre empresas Télos diferentes

### O que muda no código:
- ✅ Interface `Company` agora tem campo `empresa_telos_id`
- ✅ Nova interface `EmpresaTelos` criada
- ✅ Novas funções: `buscarEmpresaTelosDoUsuario()`, `buscarEmpresasTelos()`, `validarCNPJDuplicado()`
- ✅ Funções `criarEmpresa()` e `atualizarEmpresa()` atualizadas
- ✅ RLS policies atualizadas

### Tabelas afetadas:
- ✅ `empresas_telos` (CRIADA)
- ✅ `empresas` (adiciona coluna `empresa_telos_id`)
- ✅ `perfis` (adiciona coluna `empresa_telos_id`)

---

## 🎯 CENÁRIOS DE USO

### Cenário 1: Télos Control e Empresa Y (diferentes empresas)
```
Télos Control:
  - Cliente ABC (CNPJ: 11.222.333/0001-44) ✅
  - Cliente XYZ (CNPJ: 55.666.777/0001-88) ✅

Empresa Y:
  - Cliente ABC (CNPJ: 11.222.333/0001-44) ✅ PERMITIDO!
  - Cliente DEF (CNPJ: 99.888.777/0001-66) ✅
```

### Cenário 2: Dentro da mesma empresa (Télos Control)
```
Télos Control:
  - Cliente ABC (CNPJ: 11.222.333/0001-44) ✅
  - Cliente ABC Filial (CNPJ: 11.222.333/0001-44) ❌ ERRO: Duplicado!
```

---

## 🐛 TROUBLESHOOTING

### Erro: "function get_user_empresa_telos_id() does not exist"
**Solução**: Execute o script de migração novamente. A função pode não ter sido criada.

### Erro: "column empresa_telos_id does not exist"
**Solução**: Execute o script de migração completo. As colunas não foram adicionadas.

### Empresas antigas não aparecem mais
**Causa**: RLS policies bloqueando acesso.  
**Solução**: Execute a parte de migração de dados (PASSO 6 do script)

```sql
-- Atribuir empresa_telos_id para empresas sem valor
UPDATE empresas 
SET empresa_telos_id = '00000000-0000-0000-0000-000000000001'
WHERE empresa_telos_id IS NULL;

UPDATE perfis 
SET empresa_telos_id = '00000000-0000-0000-0000-000000000001'
WHERE empresa_telos_id IS NULL;
```

### CNPJ ainda impede duplicatas globalmente
**Causa**: Índice único antigo ainda existe.  
**Solução**: 
```sql
-- Remover constraint antiga
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_cnpj_key;

-- Verificar se índice novo existe
SELECT * FROM pg_indexes WHERE indexname = 'empresas_cnpj_empresa_telos_unique_idx';
-- Se não existir, criar:
CREATE UNIQUE INDEX empresas_cnpj_empresa_telos_unique_idx 
  ON empresas(cnpj, empresa_telos_id) 
  WHERE empresa_telos_id IS NOT NULL;
```

---

## ✅ CHECKLIST DE MIGRAÇÃO

- [ ] Backup do banco de dados criado
- [ ] Script `migration-cnpj-fix.sql` executado no SQL Editor
- [ ] Tabela `empresas_telos` existe
- [ ] Empresa Télos "Télos Control" criada
- [ ] Coluna `empresa_telos_id` existe em `empresas`
- [ ] Coluna `empresa_telos_id` existe em `perfis`
- [ ] Todas as empresas têm `empresa_telos_id` preenchido
- [ ] Todos os perfis têm `empresa_telos_id` preenchido
- [ ] Índice único `empresas_cnpj_empresa_telos_unique_idx` existe
- [ ] Função `get_user_empresa_telos_id()` existe
- [ ] Teste 1: CNPJ duplicado na mesma empresa Télos dá erro ✅
- [ ] Teste 2: CNPJ duplicado em empresas Télos diferentes funciona ✅
- [ ] App React Native testado e funcionando ✅

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs no Supabase (Database > Logs)
2. Execute as queries de verificação acima
3. Consulte a seção Troubleshooting
4. Em último caso, execute o rollback e restaure o backup

---

**Migração criada em**: 15/01/2026  
**Versão**: 1.0  
**Status**: ✅ Pronta para produção  
**Tempo estimado total**: 30-45 minutos  
