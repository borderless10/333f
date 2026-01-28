# 🔧 Solução para Erro de Conciliação

## Problema
Erro ao tentar conciliar: `"Tabela de conciliações não encontrada. Execute o script SQL de setup no Supabase."`

## Análise do Problema

Este erro pode ter várias causas:

1. **Tabela realmente não existe** - O script SQL não foi executado
2. **Erro de RLS (Row Level Security)** - Políticas bloqueando acesso
3. **Erro de permissão** - Usuário sem permissão para inserir
4. **Erro de constraint** - Violação de regras de negócio (ex: já conciliado)

## Solução Passo a Passo

### Passo 1: Verificar se a Tabela Existe

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute a seguinte query:

```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'conciliacoes'
);
```

**Se retornar `false`**: A tabela não existe. Vá para o Passo 2.
**Se retornar `true`**: A tabela existe. Vá para o Passo 3.

### Passo 2: Criar a Tabela (se não existir)

1. No **SQL Editor** do Supabase
2. Abra o arquivo `scripts/reconciliation-setup.sql`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor**
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a execução completar
7. Verifique se não há erros na aba "Messages"

### Passo 3: Verificar Políticas RLS

Se a tabela existe mas ainda há erro, pode ser problema de RLS:

1. No Supabase Dashboard, vá em **Authentication** > **Policies**
2. Procure pela tabela `conciliacoes`
3. Verifique se existem políticas para:
   - **SELECT** - Ver conciliações
   - **INSERT** - Criar conciliações
   - **UPDATE** - Atualizar conciliações
   - **DELETE** - Deletar conciliações

Se não existirem políticas, execute novamente o script `reconciliation-setup.sql` (ele cria as políticas).

### Passo 4: Verificar Permissões do Usuário

1. No Supabase Dashboard, vá em **Authentication** > **Users**
2. Encontre seu usuário
3. Verifique se o email está confirmado
4. Verifique se o usuário tem um perfil em `perfis`:

```sql
SELECT * FROM perfis WHERE usuario_id = 'SEU_USER_ID_AQUI';
```

### Passo 5: Testar a Conciliação Novamente

Após executar os passos acima:

1. Volte ao app
2. Tente criar uma conciliação novamente
3. Se ainda houver erro, verifique o console do navegador para mensagens detalhadas

## Mensagens de Erro Específicas

O sistema agora fornece mensagens de erro mais específicas:

### "Tabela não encontrada"
- **Solução**: Execute o script `reconciliation-setup.sql` no Supabase

### "Permissão negada" ou "RLS policy violation"
- **Solução**: Verifique se:
  - A transação pertence ao seu usuário (`codigo_empresa = seu_user_id`)
  - As políticas RLS estão configuradas corretamente
  - Você tem um perfil válido em `perfis`

### "Já está conciliada"
- **Solução**: Desfaça a conciliação existente antes de criar uma nova

### "Transação ou título não encontrado"
- **Solução**: Verifique se:
  - Os IDs existem no banco
  - Pertencem ao seu usuário
  - Não foram deletados

## Verificação Rápida

Execute esta query para verificar o estado completo:

```sql
-- Verificar se tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'conciliacoes'
) AS tabela_existe;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'conciliacoes';

-- Verificar se há dados
SELECT COUNT(*) FROM conciliacoes;
```

## Suporte Adicional

Se o problema persistir após seguir todos os passos:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase Dashboard > Logs
3. Compartilhe as mensagens de erro específicas que aparecem

## Arquivos Relacionados

- `scripts/reconciliation-setup.sql` - Script de criação da tabela
- `lib/services/reconciliation.ts` - Lógica de conciliação
- `components/reconciliation-modal.tsx` - Interface de conciliação
