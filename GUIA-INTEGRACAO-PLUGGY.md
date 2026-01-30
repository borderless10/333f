# Guia passo a passo: integrar Pluggy ao app

Este guia mostra **onde clicar no painel da Pluggy** e o que fazer no seu projeto para conectar contas bancárias via Open Finance.

---

## Parte 1 – No site da Pluggy (dashboard)

### Passo 1: Criar conta na Pluggy

1. Abra o navegador e acesse: **https://pluggy.ai**
2. Clique no botão **"Começar"** ou **"Criar conta"** (canto superior direito).
3. Preencha:
   - E-mail
   - Senha
   - Nome
4. Confirme o e-mail (link que a Pluggy enviar).
5. Faça login em **https://pluggy.ai** (ou **https://dashboard.pluggy.ai**).

---

### Passo 2: Acessar o Dashboard

1. Com a conta criada, acesse: **https://dashboard.pluggy.ai**
2. Faça login se ainda não estiver logado.
3. Você verá o **menu lateral esquerdo** e a área principal.

---

### Passo 3: Criar uma aplicação e pegar credenciais

1. No **menu lateral**, clique em **"Aplicações"** (ou **"Applications"**).
2. Clique no botão **"Nova aplicação"** / **"Criar aplicação"**.
3. Preencha o nome da aplicação (ex.: "333f" ou "Borderless") e salve.
4. Abra a aplicação que você criou (clique nela na lista).
5. Na tela da aplicação, procure a seção **"Credenciais"** ou **"API"**.
6. Você verá:
   - **Client ID** (ou `clientId`)
   - **Client Secret** (ou `clientSecret`)
7. **Copie e guarde** o **Client ID** e o **Client Secret** em um lugar seguro (nunca commite no Git).

**Onde clicar (resumo):**  
Dashboard → menu lateral **"Aplicações"** → **"Nova aplicação"** → abrir a app → **"Credenciais"** / **"API"** → copiar **Client ID** e **Client Secret**.

---

### Passo 4: Escolher ambiente (Sandbox x Produção)

1. Ainda na tela da aplicação no dashboard:
2. Verifique se está em **"Desenvolvimento"** (sandbox) ou **"Produção"**.
3. Para testes, use **Desenvolvimento**.
4. Quando for para produção, use a opção **"Ir para produção"** (geralmente na mesma tela ou em configurações da aplicação).

**URLs da API:**
- Sandbox: `https://api.pluggy.ai` (mesma base; o ambiente depende da aplicação no dashboard).
- Produção: `https://api.pluggy.ai`.

---

### Passo 5: Configurar redirect (se usar OAuth no app)

1. No dashboard, na **sua aplicação**, procure **"Configurações"**, **"Redirect URLs"** ou **"OAuth"**.
2. Adicione a URL de retorno do seu app, por exemplo:
   - Deep link do app: `borderless://pluggy-callback` (ou o esquema que você usar).
   - Ou a URL do Supabase / do seu backend que receberá o callback.
3. Salve as alterações.

---

## Parte 2 – No seu projeto (333f)

### Passo 6: Variáveis de ambiente

1. Na **raiz do projeto** (pasta `333f`), abra ou crie o arquivo **`.env`**.
2. Adicione (substitua pelos valores que você copiou do dashboard):

```env
# Pluggy - credenciais (NUNCA commitar no Git)
EXPO_PUBLIC_PLUGGY_CLIENT_ID=seu_client_id_aqui
EXPO_PUBLIC_PLUGGY_CLIENT_SECRET=seu_client_secret_aqui
```

**Importante:**  
O **Client Secret** não deve ser usado no app (cliente). Ele só deve ser usado em um **backend** (por exemplo, Supabase Edge Function). Se você colocar no `.env` com `EXPO_PUBLIC_`, ele ficará exposto. O ideal é:
- No **app**: usar só `EXPO_PUBLIC_PLUGGY_CLIENT_ID` se precisar.
- No **backend (Edge Function)**: usar `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` como variáveis de ambiente/secrets do Supabase.

---

### Passo 7: Backend para criar Connect Token (Supabase Edge Function)

O app **não** pode criar o Connect Token sozinho (precisa do Client Secret). Por isso usamos uma Edge Function no Supabase.

1. Crie a pasta da função (se ainda não existir):
   - `supabase/functions/pluggy-connect-token/`
2. Crie o arquivo `supabase/functions/pluggy-connect-token/index.ts` com o conteúdo que está no projeto (ver seção “Código da Edge Function” abaixo).
3. No **Supabase Dashboard**:
   - Acesse **Project Settings** (ícone de engrenagem) → **Edge Functions**.
   - Configure os **secrets**:
     - `PLUGGY_CLIENT_ID` = seu Client ID da Pluggy
     - `PLUGGY_CLIENT_SECRET` = seu Client Secret da Pluggy
4. Faça o deploy da função (CLI do Supabase ou pelo dashboard, conforme você costuma publicar).

Assim, o app só chama essa função; quem usa o Client Secret é o servidor.

---

### Passo 8: Onde o app usa a Pluggy

1. **Tela de conexões:**  
   Em **Conexões** (aba Bank Connections), o usuário toca em **"+"** ou **"Conectar conta"**.
2. **Modal “Conectar via Open Finance”:**  
   O usuário escolhe o provedor **"Plugg.to"** (ou o rótulo que você deixar para Pluggy).
3. Ao tocar em **"Conectar Conta"** com Pluggy selecionado:
   - O app chama a Edge Function **pluggy-connect-token** para obter um **connectToken**.
   - Abre o **Pluggy Connect** (WebView ou tela com o componente/SDK da Pluggy) passando esse `connectToken`.
4. Depois que o usuário conecta o banco na Pluggy:
   - O fluxo retorna (callback ou evento de sucesso) com o **itemId**.
   - O app cria/atualiza a conexão no Supabase (tabela `bank_connections`) e mostra sucesso.

Ou seja: **onde clicar no app** = **Conexões → + → Provedor "Plugg.to" → Conectar Conta**.

---

### Passo 9: Banco de dados (guardar itemId da Pluggy)

Para salvar a conexão feita pela Pluggy, você precisa guardar o **itemId** que a Pluggy devolve.

1. No **Supabase** → **SQL Editor**, execute um script que adicione a coluna (se ainda não existir), por exemplo:

```sql
ALTER TABLE bank_connections
ADD COLUMN IF NOT EXISTS pluggy_item_id TEXT;
```

2. No código, ao receber o retorno do Pluggy Connect (sucesso), use esse `itemId` para:
   - Inserir ou atualizar a linha em `bank_connections` (por exemplo, `provider = 'plugg'`, `pluggy_item_id = itemId`, `status = 'active'`).

---

### Passo 10: Testar

1. Reinicie o app: `npx expo start` (e recarregue se precisar).
2. Faça login no app.
3. Vá em **Conexões** → **+** (ou **Conectar conta**) → escolha **Pluggy** → **Conectar Conta**.
4. Deve abrir o Pluggy Connect (navegador ou WebView); use uma instituição em modo sandbox para testar.
5. Conclua o fluxo na Pluggy e volte ao app. Para que a conexão apareça na lista e fique ativa, configure webhook na Pluggy (ver documentação) ou use o SDK `react-native-pluggy-connect` para receber o `itemId` no `onSuccess`.

---

## Resumo – Onde clicar (Pluggy)

| O que fazer              | Onde clicar                                                                 |
|--------------------------|-----------------------------------------------------------------------------|
| Criar conta              | https://pluggy.ai → **Começar** / **Criar conta**                          |
| Entrar no painel         | https://dashboard.pluggy.ai → login                                         |
| Ver/criar aplicação      | Menu lateral → **Aplicações** → **Nova aplicação**                         |
| Pegar Client ID/Secret   | Abrir a aplicação → **Credenciais** ou **API** → copiar Client ID e Secret |
| Ambiente (sandbox/prod)  | Na tela da aplicação → **Desenvolvimento** ou **Produção** / **Ir para produção** |
| Redirect / OAuth         | Na aplicação → **Configurações** ou **Redirect URLs** → adicionar URL       |

---

## Resumo – No projeto

1. **Dashboard Pluggy:** criar app, copiar Client ID e Client Secret.
2. **Supabase:** configurar secrets `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` e publicar a Edge Function `pluggy-connect-token`.
3. **.env:** usar apenas o que for seguro no cliente (ideal: só Client ID se precisar; secret só no backend).
4. **App:** em **Conexões → + → Pluggy → Conectar Conta** o app chama a Edge Function, abre o Pluggy Connect e, no callback (ou via webhook), salva a conexão com `pluggy_item_id` em `bank_connections`.

---

## Observação sobre a URL do Pluggy Connect

O app abre o Pluggy Connect em um navegador (ou WebView) usando uma URL com o `connectToken`. Se essa URL não funcionar (página em branco ou erro), a Pluggy pode exigir o uso do **widget embutido**. Nesse caso:

1. Instale o SDK: `npx expo install react-native-pluggy-connect` (ou o pacote indicado na documentação da Pluggy).
2. Use o componente Pluggy Connect dentro do app (modal/tela) passando o `connectToken` obtido pela Edge Function.
3. No callback `onSuccess` do widget você recebe o `itemId` e pode salvar a conexão em `bank_connections` com `pluggy_item_id`.

Consulte a documentação oficial: https://docs.pluggy.ai/docs/setup-pluggyconnect-widget-on-your-app

---

Se você seguir esses passos na ordem, terá a Pluggy integrada ao app com os cliques certos no dashboard e no fluxo do app.
