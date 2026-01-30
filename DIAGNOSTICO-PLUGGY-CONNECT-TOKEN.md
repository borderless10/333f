# Diagnóstico: "Esqueceu de incluir o Connect Token"

## Causa raiz (confirmada)

A barra de endereço do navegador mostra **`connect.pluggy.ai/?c`** — a URL está **truncada**. O Connect Token é um JWT longo (centenas de caracteres). Ao abrir a URL completa com `Linking.openURL()`, o **Intent/Android** (ou o tratamento de URLs do sistema) **trunca** a URL; o navegador recebe só o início (`connect.pluggy.ai/?c`), então a Pluggy não recebe o token.

**Solução implementada:** fluxo de **redirect**. O app abre uma **URL curta** (ex.: `https://xxx.supabase.co/functions/v1/pluggy-redirect/uuid`). O servidor responde com **302** para a URL completa com o token. O navegador segue o redirect e chega na Pluggy com a URL completa — sem truncamento.

**Se aparecer "Missing authorization header" (401):** o navegador abre a URL de redirect **sem** enviar o header `Authorization`. A função **pluggy-redirect** precisa ser **pública** (sem verificação de JWT). Faça o deploy com:  
`npx supabase functions deploy pluggy-redirect --no-verify-jwt`  
E/ou confira no `supabase/config.toml` a seção `[functions.pluggy-redirect]` com `verify_jwt = false`.

---

## Token na URL mas a página ainda diz "esqueceu de incluir"

Se a URL no navegador **já** contém `?connectToken=eyJ...` e a Pluggy ainda mostra "esqueceu de incluir o Connect Token":

- A página **connect.pluggy.ai** pode **não ler** o token da query string. A documentação da Pluggy fala em passar o token ao **inicializar o widget com JavaScript** (`connectToken` no `PluggyConnect`), não necessariamente como parâmetro de URL ao abrir a página.
- Ou seja: abrir `connect.pluggy.ai?connectToken=xxx` pode não ser um fluxo suportado; a página espera o token quando o **widget** é inicializado no seu app (SDK).

**O que fazer:**

1. **Testar com includeSandbox:** O redirect foi alterado para incluir `&includeSandbox=true` na URL. Faça o deploy de novo da função **pluggy-redirect** e teste. Se você está em ambiente de desenvolvimento/sandbox na Pluggy, isso pode ser necessário.
2. **Solução definitiva – widget no app:** Use o SDK **react-native-pluggy-connect** dentro do app. O app chama a Edge Function, recebe o `connectToken`, e passa esse token para o componente Pluggy Connect (em memória). Assim o token nunca depende da URL e o fluxo é o recomendado pela Pluggy. Instalação: `npx expo install react-native-pluggy-connect` (ou `npm install react-native-pluggy-connect`) e use o componente conforme a documentação: https://docs.pluggy.ai/docs/setup-pluggyconnect-widget-on-your-app

## Análise do seu .env

| Variável no .env | Usado pela integração Pluggy? | Onde é usado |
|------------------|-------------------------------|---------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ Sim | App chama a Edge Function nessa URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ Sim | App envia no header `Authorization: Bearer ...` |
| `EXPO_PUBLIC_PLUGG_API_KEY` | ❌ Não | Nome é "Plugg.to"; a Edge Function **não** lê .env |
| `EXPO_PUBLIC_PLUGG_API_SECRET` | ❌ Não | Idem |

**Conclusão:** As credenciais da Pluggy que você colocou em `EXPO_PUBLIC_PLUGG_*` **não são usadas** pela nossa integração. A Edge Function lê **apenas** os secrets configurados no **Supabase Dashboard** (nomes: `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET`). O .env do projeto não é lido pela função (ela roda nos servidores do Supabase).

---

## Causas mais prováveis do erro

### 1. **Secrets da Pluggy não configurados no Supabase** (muito provável)

Se você só colocou as credenciais no .env e **não** configurou os **secrets** da Edge Function no Supabase:

- A função retorna **500** com mensagem "Credenciais Pluggy não configuradas".
- O app mostraria um **toast de erro** e **não** abriria o navegador.

Se o navegador **abre** e a página da Pluggy carrega, então a função está retornando **200** e um token. Nesse caso a causa não é essa.

**O que fazer:** Supabase Dashboard → Project Settings → Edge Functions → abrir a função **pluggy-connect-token** → **Secrets** → criar:

- `PLUGGY_CLIENT_ID` = `6b4285c4-50fd-4f7d-8795-cfb4d3c9cc58` (o mesmo valor do seu .env em PLUGG_API_KEY)
- `PLUGGY_CLIENT_SECRET` = `b63cdec1-063a-4302-9a94-3129e84dcde6` (o mesmo valor do seu .env em PLUGG_API_SECRET)

---

### 2. **A página connect.pluggy.ai não lê o token da URL** (muito provável)

A documentação da Pluggy fala em passar o token ao **inicializar o widget com JavaScript** (`connectToken` no `PluggyConnect`), não necessariamente como parâmetro de URL ao abrir a página.

Ou seja: **https://connect.pluggy.ai** pode ser uma página que:

- não lê `?connectToken=...` ou `#connectToken=...`;
- espera o token quando o **widget** é inicializado no seu app (SDK / WebView com JS).

Nesse caso, mesmo com token na URL, a página exibe "Esqueceu de incluir o Connect Token".

**O que fazer:** Usar o **widget embutido** (SDK `react-native-pluggy-connect`) dentro do app, passando o `connectToken` obtido pela Edge Function. Assim o token é passado corretamente na inicialização.

---

### 3. **Navegador in-app (WebBrowser) cortando query/hash**

Em alguns dispositivos ou versões, o navegador in-app (`expo-web-browser`) pode:

- não preservar query string ou hash ao abrir a URL;
- abrir só `https://connect.pluggy.ai`, sem o token.

**O que fazer:** Tentar abrir no **navegador do sistema** com `Linking.openURL(url)` em vez de `WebBrowser.openBrowserAsync(url)`, para ver se a URL completa (com token) é preservada.

---

### 4. **Cache do Expo / .env não carregado**

Se `EXPO_PUBLIC_SUPABASE_ANON_KEY` não for carregada (cache, build antigo):

- A requisição à Edge Function vai **sem** Bearer válido → **401**.
- O app mostra erro e **não** abre o navegador.

Se o navegador **abre**, o app conseguiu chamar a função e obter resposta. Então essa causa é menos provável quando a página da Pluggy abre.

**O que fazer:** Rodar `npx expo start --clear` e testar de novo.

---

## Resumo das ações recomendadas

1. **Conferir secrets no Supabase**  
   Garantir `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` com os mesmos valores do .env (Client ID e Client Secret da aplicação 333f na Pluggy).

2. **Testar a Edge Function com curl**  
   Usar a anon key real no header. Se retornar `{"connectToken":"eyJ..."}` ou `{"accessToken":"eyJ..."}`, a função está ok.

3. **Tentar abrir no navegador do sistema**  
   No app, usar `Linking.openURL(pluggyUrl)` em vez de `WebBrowser.openBrowserAsync(pluggyUrl)` para ver se a mensagem "Esqueceu de incluir" some (URL completa preservada).

4. **Solução definitiva: widget no app**  
   Se mesmo assim a página não aceitar o token pela URL, integrar o **Pluggy Connect** via SDK (`react-native-pluggy-connect`) dentro do app e passar o `connectToken` retornado pela Edge Function na inicialização do widget.

---

## Referência rápida: quem usa o quê

| Quem | O que usa |
|-----|------------|
| **App (React Native)** | `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` para chamar a Edge Function |
| **Edge Function (Supabase)** | Secrets `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` (não lê .env) |
| **.env PLUGG_*** | Não usado pela integração Pluggy atual; pode ser usado por outro fluxo (Plugg.to) |
