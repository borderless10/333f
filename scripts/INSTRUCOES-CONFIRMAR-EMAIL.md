# Instruções para Confirmar Email Automaticamente

## Problema
Quando um admin cria um novo usuário através da aba "Gerenciar Usuários", o usuário é criado corretamente, mas não consegue fazer login porque o email não está confirmado.

## Solução

### Opção 1: Executar a Função RPC (Recomendado)

Execute o seguinte SQL no Supabase SQL Editor:

```sql
-- Função para confirmar email automaticamente após criação
CREATE OR REPLACE FUNCTION confirmar_email_usuario(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Verifica se o usuário atual é admin
  IF NOT EXISTS (
    SELECT 1 FROM perfis
    WHERE usuario_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem confirmar emails';
  END IF;

  -- Verifica se o usuário existe
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  -- Confirma o email do usuário
  UPDATE auth.users
  SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Garante que a função pode ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION confirmar_email_usuario(UUID) TO authenticated;
```

**OU** execute o arquivo `scripts/confirm-user-email-rpc.sql` que já contém este código.

### Opção 2: Desabilitar Confirmação de Email (Mais Simples)

1. Acesse o **Supabase Dashboard**
2. Vá em **Authentication** → **Providers** → **Email**
3. Desabilite a opção **"Confirm email"**
4. Salve as alterações

Com isso, todos os novos usuários criados não precisarão confirmar o email antes de fazer login.

### Opção 3: Confirmar Email Manualmente (Temporário)

Se você já criou usuários que não conseguem fazer login, pode confirmar o email manualmente executando:

```sql
-- Substitua 'USER_ID_AQUI' pelo ID do usuário
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE id = 'USER_ID_AQUI';
```

Para encontrar o ID do usuário:

```sql
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'email@exemplo.com';
```

## Após Executar

Após executar a Opção 1 ou 2, os novos usuários criados através da aba "Gerenciar Usuários" poderão fazer login imediatamente sem precisar confirmar o email.
