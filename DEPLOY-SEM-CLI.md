# Deploy das Edge Functions SEM usar o Supabase CLI

Como o comando `supabase` não está instalado, você pode fazer o deploy **direto pelo Dashboard** do Supabase, copiando e colando o código. Leva cerca de 15 minutos.

---

## Opção 1: Usar `npx` (sem instalar globalmente)

No terminal do projeto, rode **um comando por vez** (pode demorar na primeira vez pois baixa o pacote):

```powershell
cd "c:\Users\ferna\OneDrive\Área de Trabalho\Borderless\333f"

npx supabase login
npx supabase link --project-ref wqqxyupgndcpetqzudez
npx supabase functions deploy pluggy-transactions
npx supabase functions deploy pluggy-accounts
```

Se der timeout ou erro de rede, use a **Opção 2** (Dashboard).

---

## Opção 2: Deploy pelo Dashboard (recomendado se npx falhar)

### Passo 1: Abrir o Supabase

1. Acesse: **https://supabase.com/dashboard**
2. Faça login e abra seu projeto
3. No menu lateral, clique em **Edge Functions**

---

### Passo 2: Criar a função `pluggy-transactions`

1. Clique em **"Deploy a new function"** (ou **"Nova função"**)
2. Escolha **"Via Editor"** (criar pelo editor)
3. **Nome da função:** digite exatamente: `pluggy-transactions`
4. Apague todo o código que vier no editor (template)
5. Abra no seu computador o arquivo:
   ```
   supabase\functions\pluggy-transactions\index.ts
   ```
6. Selecione **todo** o conteúdo (Ctrl+A), copie (Ctrl+C)
7. Cole no editor do Dashboard (Ctrl+V)
8. Clique em **"Deploy function"** (ou **"Implantar"**)
9. Aguarde aparecer a mensagem de sucesso (10–30 segundos)

---

### Passo 3: Criar a função `pluggy-accounts`

1. De volta à lista de Edge Functions, clique de novo em **"Deploy a new function"**
2. Escolha **"Via Editor"**
3. **Nome da função:** digite exatamente: `pluggy-accounts`
4. Apague todo o código do editor
5. Abra no seu computador o arquivo:
   ```
   supabase\functions\pluggy-accounts\index.ts
   ```
6. Selecione todo o conteúdo (Ctrl+A), copie (Ctrl+C)
7. Cole no editor do Dashboard (Ctrl+V)
8. Clique em **"Deploy function"**
9. Aguarde a mensagem de sucesso

---

### Passo 4: Conferir os Secrets

As funções usam os mesmos secrets da `pluggy-connect-token`:

1. No Dashboard, vá em **Project Settings** (ícone de engrenagem)
2. Clique em **Edge Functions**
3. Aba **Secrets**
4. Confirme que existem:
   - `PLUGGY_CLIENT_ID`
   - `PLUGGY_CLIENT_SECRET`

Se não existirem, crie com os valores de **Produção** da Pluggy (veja `GUIA-MIGRACAO-PLUGGY-PREMIUM.md`).

---

## Depois do deploy

1. **SQL:** Execute o script `scripts/add-bank-transaction-id.sql` no **SQL Editor** do Supabase (uma vez só).
2. **App:** Reinicie o app (`npx expo start`) e teste:
   - Conexões → Conectar conta → Importar Transações → Importar Saldo

---

## Resumo

| O que fazer              | Onde                         |
|--------------------------|------------------------------|
| Criar `pluggy-transactions` | Edge Functions → Deploy new → Via Editor |
| Criar `pluggy-accounts`     | Edge Functions → Deploy new → Via Editor |
| Colar código              | De `supabase/functions/.../index.ts` |
| Secrets                   | Project Settings → Edge Functions → Secrets |
| SQL                       | SQL Editor → `add-bank-transaction-id.sql` |

Não é necessário instalar o Supabase CLI no PC; o deploy pelo Dashboard é suficiente.
