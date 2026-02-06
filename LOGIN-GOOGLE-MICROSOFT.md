# Login com Google e Microsoft – Configuração

O app já está preparado para login com **Google** e **Microsoft** (OAuth). Para funcionar na prática, é preciso configurar o **Supabase** e (opcionalmente) os provedores.

---

## 1. URLs de redirecionamento no Supabase

Sem isso, o login social falha com erro de redirect.

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e abra seu projeto.
2. Vá em **Authentication** → **URL Configuration**.
3. Em **Redirect URLs**, adicione as URLs abaixo (uma por linha):

   ```
   333f://**
   exp://**
   ```

   - `333f://**` – usado quando o app está rodando com o scheme `333f` (build de desenvolvimento ou produção com esse scheme).
   - `exp://**` – usado no **Expo Go** (desenvolvimento).

4. Se você usar outro **scheme** no `app.json` (por exemplo em um build EAS), adicione também:

   ```
   com.julio.projeto333://**
   ```

5. Clique em **Save**.

---

## 2. Habilitar Google no Supabase

1. No Dashboard: **Authentication** → **Providers** → **Google**.
2. Ative **Enable Sign in with Google**.
3. Crie credenciais no [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
   - Tipo: **Web application** (para uso no Supabase).
   - **Authorized redirect URIs**: use exatamente a URL que o Supabase mostra na tela do provider Google (algo como `https://wqqxyupgndcpetqzudez.supabase.co/auth/v1/callback`).
4. Copie **Client ID** e **Client Secret** para os campos do provider Google no Supabase.
5. Salve no Supabase.

---

## 3. Habilitar Microsoft (Azure) no Supabase

1. No Dashboard: **Authentication** → **Providers** → **Azure**.
2. Ative **Enable Sign in with Azure**.
3. No [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**:
   - Nome: ex. "Meu App Login".
   - Supported account types: conforme seu caso (ex. "Accounts in any organizational directory and personal Microsoft accounts").
   - Redirect URI: **Web** e use a URL de callback do Supabase (ex. `https://wqqxyupgndcpetqzudez.supabase.co/auth/v1/callback`).
4. Depois de criar o app:
   - **Overview** → copie **Application (client) ID**.
   - **Certificates & secrets** → **New client secret** → copie o **Value** (secret).
5. No Supabase, preencha **Client ID** (Application ID) e **Client Secret** (valor do secret).
6. (Opcional) Em **API permissions**, adicione **Microsoft Graph** → **OpenId permissions** (ex. `openid`, `email`, `profile`) se quiser email/nome.
7. Salve no Supabase.

---

## 4. Fluxo no app

1. Usuário toca em **Google** ou **Microsoft** na tela de login.
2. O app abre o browser (ou WebView) na página de login do provedor.
3. Após o usuário autorizar, o provedor redireciona para a URL configurada (ex. `333f://...` ou `exp://...`).
4. O app recebe a URL, extrai `access_token` e `refresh_token` e chama `supabase.auth.setSession()`.
5. O **AuthContext** detecta a sessão e o usuário é redirecionado para a área logada.

---

## 5. Perfil do usuário (role)

Se o app usa a tabela `perfis` (ou similar) para definir **role** (admin, analista, viewer), você pode:

- Criar um **trigger** no Supabase que, ao inserir em `auth.users`, insere um registro em `perfis` com um role padrão (ex. `viewer`), ou
- Tratar no app: se não existir perfil após o primeiro login social, redirecionar para uma tela de “completar cadastro” ou criar o perfil com role padrão.

Assim, usuários que entram só por Google/Microsoft também passam a ter perfil e permissões corretas.

---

## 6. Resumo de checklist

- [ ] **Redirect URLs** no Supabase: `333f://**` e `exp://**` (e outro scheme se usar).
- [ ] **Google**: provider ativado no Supabase + OAuth Client no Google Cloud + Client ID/Secret no Supabase.
- [ ] **Microsoft**: provider Azure ativado no Supabase + App registration no Azure + Client ID/Secret no Supabase.
- [ ] (Opcional) Trigger ou fluxo no app para criar **perfil** para novos usuários OAuth.

Depois disso, o login com Google e com Microsoft passa a funcionar na prática.
