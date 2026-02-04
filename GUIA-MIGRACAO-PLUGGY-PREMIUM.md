# Guia: Migrar para Conta Pluggy Premium (Empresa)

Este guia mostra como trocar a conta Pluggy atual (Sandbox/Free) por uma **conta Premium da empresa** para usar bancos reais do Brasil.

---

## Passo 1: Obter credenciais Premium no Dashboard Pluggy

### 1.1 Acessar a conta Premium da empresa

1. Acesse **https://dashboard.pluggy.ai**
2. Faça login com a **conta Premium da empresa** (não use a conta Sandbox/Free antiga).
3. Se a empresa ainda não tem conta Premium:
   - Entre em contato com a Pluggy para contratar o plano **Pro** ou **Enterprise**
   - Ou acesse **Billing** no dashboard e faça upgrade

### 1.2 Criar/abrir aplicação na conta Premium

1. No dashboard Premium, vá em **Aplicações** (menu lateral).
2. **Opção A:** Se já existe uma aplicação Premium:
   - Clique na aplicação (ex.: "333f" ou "Borderless")
   - Verifique que está no ambiente **Produção** (não "Desenvolvimento" ou "Sandbox")
   
3. **Opção B:** Se precisa criar nova aplicação:
   - Clique em **"Nova aplicação"** / **"Criar aplicação"**
   - Nome: ex. "333f" ou "Borderless"
   - Ambiente: escolha **Produção** (não Sandbox)
   - Salve

### 1.3 Copiar credenciais de Produção

1. Na tela da aplicação Premium (em **Produção**), procure **"Credenciais"** ou **"API"**.
2. Você verá:
   - **Client ID** (de Produção - diferente do Sandbox)
   - **Client Secret** (de Produção - diferente do Sandbox)
3. **Copie e guarde** essas credenciais em um lugar seguro (nunca commite no Git).

**⚠️ Importante:** As credenciais de **Produção** são diferentes das de **Sandbox**. Use sempre as de **Produção** para bancos reais.

---

## Passo 2: Atualizar secrets no Supabase

### 2.1 Acessar secrets da Edge Function

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Abra o projeto do seu app
3. Vá em **Project Settings** (ícone de engrenagem) → **Edge Functions**
4. Clique na aba **Secrets** (ou procure por "Secrets" / "Environment Variables")

### 2.2 Atualizar PLUGGY_CLIENT_ID

1. Procure o secret **`PLUGGY_CLIENT_ID`**
2. Clique para editar (ou delete e crie novo)
3. Cole o **Client ID de Produção** que você copiou no Passo 1.3
4. Salve

### 2.3 Atualizar PLUGGY_CLIENT_SECRET

1. Procure o secret **`PLUGGY_CLIENT_SECRET`**
2. Clique para editar (ou delete e crie novo)
3. Cole o **Client Secret de Produção** que você copiou no Passo 1.3
4. Salve

**⚠️ Importante:** 
- Substitua **completamente** os valores antigos (Sandbox) pelos novos (Produção)
- Os secrets são atualizados imediatamente; não precisa redeploy da função

---

## Passo 3: Configurar app para Produção (opcional)

### 3.1 Esconder bancos Sandbox (recomendado para Produção)

Para que o widget mostre **apenas bancos reais** (sem "Pluggy Bank" / sandbox):

1. No arquivo **`.env`** do projeto, adicione ou atualize:
   ```env
   EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false
   ```

2. Se não definir essa variável, o app continua com `includeSandbox=true` (mostra Pluggy Bank para testes).

**Recomendação:** 
- **Produção:** `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false` (só bancos reais)
- **Desenvolvimento/Testes:** `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=true` (permite testar com Pluggy Bank)

### 3.2 Reiniciar o app

1. Pare o servidor Expo (`Ctrl+C` no terminal)
2. Inicie novamente: `npx expo start`
3. Recarregue o app no dispositivo/emulador

---

## Passo 4: Verificar e testar

### 4.1 Verificar credenciais no Supabase

1. No Supabase Dashboard → **Edge Functions** → **Secrets**
2. Confirme que **`PLUGGY_CLIENT_ID`** e **`PLUGGY_CLIENT_SECRET`** têm os valores **de Produção** (não os antigos de Sandbox)

### 4.2 Testar conexão no app

1. Abra o app
2. Vá em **Conexões** → **+** → **Conectar Conta**
3. Toque em **"Conectar Conta"** (Pluggy)
4. O widget Pluggy Connect deve abrir
5. **Verifique:**
   - Se `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false`: deve aparecer **apenas bancos reais** (Itaú, Nubank, Bradesco, etc.) - **sem** "Pluggy Bank" ou "Demo"
   - Se `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=true`: pode aparecer "Pluggy Bank" junto com bancos reais (útil para testes)

### 4.3 Conectar uma conta real (teste)

1. No widget Pluggy Connect, digite o nome de um banco real (ex.: "Nubank", "Itaú")
2. Selecione o banco na lista
3. Siga o fluxo de login/consentimento
4. Após conectar, a conexão deve aparecer na lista do app com status **"Ativa"**

---

## Passo 5: Migrar conexões existentes (se necessário)

### 5.1 Conexões antigas (Sandbox)

Se você tinha conexões criadas com a conta **Sandbox**:

- **Opção A:** Manter as conexões antigas (elas continuam funcionando, mas podem estar limitadas ao ambiente Sandbox)
- **Opção B:** Revogar conexões antigas e criar novas com a conta Premium (recomendado para Produção)

### 5.2 Criar novas conexões com Premium

1. No app, revogue conexões antigas (se quiser limpar)
2. Crie novas conexões usando a conta Premium
3. As novas conexões usarão bancos reais e terão acesso completo aos dados

---

## Checklist de migração

- [ ] Conta Premium Pluggy ativa (plano Pro/Enterprise)
- [ ] Aplicação criada/aberta em **Produção** no dashboard Pluggy
- [ ] **Client ID de Produção** copiado
- [ ] **Client Secret de Produção** copiado
- [ ] Secret **`PLUGGY_CLIENT_ID`** atualizado no Supabase com valor de Produção
- [ ] Secret **`PLUGGY_CLIENT_SECRET`** atualizado no Supabase com valor de Produção
- [ ] `.env` configurado com `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false` (opcional, mas recomendado)
- [ ] App reiniciado após mudanças no `.env`
- [ ] Teste de conexão realizado com sucesso
- [ ] Lista de bancos mostra apenas bancos reais (sem "Pluggy Bank" se `includeSandbox=false`)

---

## O que NÃO precisa mudar no código

✅ **Não precisa alterar:**
- Edge Function `pluggy-connect-token` (ela lê os secrets automaticamente)
- Componente `PluggyConnectModal` (já está configurado para ler `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX`)
- Serviço `lib/services/pluggy.ts` (não precisa mudar)
- Tabelas do banco (`bank_connections`, `integration_logs`) - continuam funcionando

**A única mudança necessária é trocar os secrets no Supabase.** O código já está preparado para Produção.

---

## Troubleshooting

### Erro: "Falha ao autenticar com Pluggy"

- **Causa:** Credenciais erradas ou de Sandbox
- **Solução:** Verifique se os secrets no Supabase têm os valores **de Produção** (não Sandbox)

### Ainda aparece "Pluggy Bank" / "Demo"

- **Causa:** `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX` não está definido ou está como `true`
- **Solução:** Adicione `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false` no `.env` e reinicie o app

### Widget não carrega / erro ao conectar

- **Causa:** Credenciais Premium inválidas ou conta não ativada
- **Solução:** Verifique no dashboard Pluggy se a aplicação está em **Produção** e se o plano Premium está ativo

### Conexões antigas não funcionam

- **Causa:** Conexões criadas com Sandbox podem não funcionar com Produção
- **Solução:** Revogue conexões antigas e crie novas com a conta Premium

---

## Resumo rápido

| Onde | O que fazer |
|------|-------------|
| **Pluggy Dashboard** | Login com conta Premium → Aplicação em **Produção** → Copiar Client ID e Client Secret de **Produção** |
| **Supabase** | Project Settings → Edge Functions → Secrets → Atualizar `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` com valores de **Produção** |
| **App (.env)** | Adicionar `EXPO_PUBLIC_PLUGGY_INCLUDE_SANDBOX=false` (opcional) |
| **App** | Reiniciar e testar conexão |

---

**Pronto!** Após seguir esses passos, o app estará usando a conta Premium e mostrará bancos reais do Brasil. 🎉
