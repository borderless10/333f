# Deploy Manual da Edge Function: pluggy-item-status

## O que faz essa função?

A Edge Function `pluggy-item-status` verifica o status de uma conexão Pluggy e pode renovar automaticamente se estiver desatualizada.

**Benefícios:**
- Renovação automática de tokens expirados
- Verifica se a conexão precisa de ação do usuário (relogin)
- Mantém conexões sempre atualizadas

---

## Como fazer deploy (via Dashboard - SEM CLI)

### 1. Acesse o Supabase Dashboard

1. Vá em https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **Edge Functions**
4. Clique em **Deploy a new function**
5. Escolha **Via Editor**

### 2. Configure a função

1. **Nome da função:** `pluggy-item-status`
2. **Código:** Copie TODO o conteúdo do arquivo `supabase/functions/pluggy-item-status/index.ts`
3. Cole no editor
4. Clique em **Deploy function**

### 3. Aguarde o deploy

- O deploy leva ~30 segundos
- Quando concluir, a função aparecerá na lista

### 4. Verificar secrets

As mesmas credenciais já configuradas (`PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`) são compartilhadas entre todas as Edge Functions. Não precisa configurar novamente.

---

## Como fazer deploy (via CLI - se tiver instalado)

```bash
# Via npx (sem instalar globalmente)
npx supabase functions deploy pluggy-item-status

# Ou com CLI instalado globalmente
supabase functions deploy pluggy-item-status
```

---

## Como testar

A função é chamada automaticamente pelo hook `useTokenRenewal` que roda:
- A cada 30 minutos
- Ao abrir o app
- Ao entrar na tela de conexões

Você não precisa chamar manualmente, mas se quiser testar:

```typescript
import { checkAndRenewPluggyItem } from '@/lib/services/pluggy';

// Verificar status de um item
const result = await checkAndRenewPluggyItem('seu-item-id', true);

console.log('Status:', result.status); // UPDATED, OUTDATED, LOGIN_ERROR, etc.
console.log('Renovado:', result.renewed); // true se foi renovado automaticamente
console.log('Precisa ação:', result.needsUserAction); // true se precisa relogin
```

---

## Logs da função

Para ver os logs da função no Dashboard:
1. **Edge Functions** → **pluggy-item-status**
2. Clique na aba **Logs**
3. Veja erros e execuções em tempo real

---

## Troubleshooting

### ❌ Erro: "Credenciais Pluggy não configuradas"

**Solução:** Configure os secrets no Dashboard:
- **Project Settings** → **Edge Functions** → **Secrets**
- Adicione `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`

### ❌ Erro: "Erro ao buscar status do item"

**Possíveis causas:**
- Item ID inválido ou inexistente
- Credenciais Pluggy incorretas
- Item foi deletado no Pluggy

**Solução:** Verifique se o `pluggy_item_id` na tabela `bank_connections` está correto.

### ❌ Função não aparece na lista

**Solução:** Aguarde ~30 segundos após o deploy e recarregue a página.

---

## Quando a renovação automática funciona?

✅ **Funciona automaticamente (sem ação do usuário):**
- Token expirado há menos de 7 dias
- Credenciais do banco ainda válidas no Pluggy
- Status do item é `OUTDATED`

❌ **Requer ação do usuário (relogin):**
- Token expirado há mais de 7 dias
- Banco mudou credenciais/MFA
- Status do item é `LOGIN_ERROR` ou `WAITING_USER_INPUT`

Nestes casos, o usuário verá uma notificação para renovar manualmente via botão "Renovar Consentimento".

---

**Última atualização:** 09/02/2026
