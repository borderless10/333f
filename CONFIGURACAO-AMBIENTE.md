# 🔐 Configuração de Variáveis de Ambiente

## Como configurar

### 1. Criar arquivo `.env`

Na raiz do projeto, crie um arquivo chamado `.env` (sem extensão) com o seguinte conteúdo:

```env
EXPO_PUBLIC_SUPABASE_URL=https://wqqxyupgndcpetqzudez.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcXh5dXBnbmRjcGV0cXp1ZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODkxMTIsImV4cCI6MjA3OTY2NTExMn0.QS83QorW71kDqlwH9r8NN87QOvA2XXDWpn4O-DSabzc
```

### 2. Reiniciar o servidor

Após criar o arquivo `.env`, você precisa reiniciar o servidor do Expo:

```bash
# Pare o servidor atual (Ctrl+C) e inicie novamente
npx expo start
```

### 3. Verificar funcionamento

O app deve funcionar normalmente. Se as variáveis de ambiente não forem encontradas, o código usará valores padrão como fallback.

## ⚠️ Importante

- O arquivo `.env` **NÃO** será commitado no Git (já está no `.gitignore`)
- **NUNCA** compartilhe suas credenciais do Supabase publicamente
- Para produção, use variáveis de ambiente do seu provedor de hospedagem

## 🔍 Onde encontrar as credenciais do Supabase

1. Acesse o [painel do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
