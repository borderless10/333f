# 🚀 Guia Completo - Como Criar Conta e Configurar Plugg.to

## 📋 O QUE É O PLUGG.TO?

O **Plugg.to** é uma plataforma brasileira que facilita a integração com Open Banking/FINANCE no Brasil. Eles fazem a ponte entre seu aplicativo e os bancos, simplificando muito o processo.

**Vantagens:**
- ✅ Focado no mercado brasileiro
- ✅ Suporta principais bancos do Brasil
- ✅ API simples e bem documentada
- ✅ Ambiente sandbox para testes
- ✅ Suporte em português

---

## 📝 PASSO 1: Criar Conta no Plugg.to (15 minutos)

### 1.1. Acessar o Site

1. Abra seu navegador
2. Acesse: **https://plugg.to**
3. Clique em **"Começar Agora"** ou **"Cadastre-se"**

### 1.2. Preencher Dados de Cadastro

Você precisará fornecer:
- **Nome completo**
- **Email** (use um email válido, será necessário confirmar)
- **Senha** (mínimo 8 caracteres)
- **Telefone** (opcional, mas recomendado)
- **Empresa/Organização** (nome da sua empresa ou projeto)

### 1.3. Confirmar Email

1. Verifique sua caixa de entrada
2. Abra o email do Plugg.to
3. Clique no link de confirmação
4. Você será redirecionado para o dashboard

### 1.4. Completar Perfil

1. No dashboard, complete seu perfil:
   - Dados da empresa
   - CNPJ (se tiver)
   - Endereço
   - Informações de contato

**Nota:** Alguns dados podem ser opcionais dependendo do plano escolhido.

---

## 📝 PASSO 2: Escolher Plano (5 minutos)

### 2.1. Planos Disponíveis

O Plugg.to geralmente oferece:

1. **Plano Sandbox/Teste** (Gratuito)
   - Ambiente de testes
   - Limitações de uso
   - Ideal para desenvolvimento

2. **Plano Starter** (Pago)
   - Uso em produção
   - Volume limitado
   - Ideal para pequenas empresas

3. **Plano Business** (Pago)
   - Uso em produção
   - Volume maior
   - Suporte prioritário

### 2.2. Recomendação

**Para começar:** Use o **Plano Sandbox** (gratuito)
- Permite testar todas as funcionalidades
- Não precisa de cartão de crédito
- Ideal para desenvolvimento

**Depois:** Quando estiver pronto para produção, migre para um plano pago.

---

## 📝 PASSO 3: Obter Credenciais da API (10 minutos)

### 3.1. Acessar Dashboard

1. Faça login em: **https://app.plugg.to** ou **https://dashboard.plugg.to**
2. Você será redirecionado para o painel principal

### 3.2. Navegar para Configurações da API

1. No menu lateral, procure por:
   - **"API"** ou
   - **"Integrações"** ou
   - **"Configurações"** ou
   - **"Credenciais"**

2. Clique na opção correspondente

### 3.3. Encontrar Credenciais

Você deve encontrar algo como:

- **API Key** (ou Client ID)
- **API Secret** (ou Client Secret)
- **Base URL** (geralmente `https://api.plugg.to` ou `https://sandbox.plugg.to`)

**Importante:**
- ⚠️ **NUNCA compartilhe essas credenciais**
- ⚠️ **NUNCA commite no Git**
- ⚠️ Guarde em local seguro

### 3.4. Se Não Encontrar as Credenciais

Algumas opções:

1. **Verificar Documentação:**
   - Acesse: https://docs.plugg.to
   - Procure por "Getting Started" ou "API Credentials"

2. **Contatar Suporte:**
   - Email: suporte@plugg.to
   - Chat no site (se disponível)
   - Pergunte: "Como obtenho minhas credenciais de API?"

3. **Verificar Email de Boas-vindas:**
   - O Plugg.to pode ter enviado as credenciais por email

---

## 📝 PASSO 4: Configurar no Projeto (5 minutos)

### 4.1. Abrir Arquivo `.env`

1. Na raiz do seu projeto
2. Abra o arquivo `.env` (ou crie se não existir)

### 4.2. Adicionar Credenciais

Adicione as seguintes linhas (substitua pelos valores reais):

```env
# =====================================================
# CONFIGURAÇÃO OPEN FINANCE - PLUGG.TO
# =====================================================
EXPO_PUBLIC_PLUGG_API_KEY=sua_api_key_aqui
EXPO_PUBLIC_PLUGG_API_SECRET=sua_api_secret_aqui
EXPO_PUBLIC_PLUGG_BASE_URL=https://api.plugg.to
```

**Exemplo real:**
```env
EXPO_PUBLIC_PLUGG_API_KEY=pk_live_abc123xyz789
EXPO_PUBLIC_PLUGG_API_SECRET=sk_live_def456uvw012
EXPO_PUBLIC_PLUGG_BASE_URL=https://api.plugg.to
```

**Para ambiente de teste/sandbox:**
```env
EXPO_PUBLIC_PLUGG_API_KEY=pk_test_abc123xyz789
EXPO_PUBLIC_PLUGG_API_SECRET=sk_test_def456uvw012
EXPO_PUBLIC_PLUGG_BASE_URL=https://sandbox.plugg.to
```

### 4.3. Verificar Formato

Certifique-se de que:
- ✅ Não há espaços antes/depois do `=`
- ✅ Não há aspas nas credenciais (a menos que o valor contenha espaços)
- ✅ Não há linhas em branco extras
- ✅ Cada variável está em uma linha separada

---

## 📝 PASSO 5: Reiniciar Servidor (2 minutos)

### 5.1. Parar Servidor Atual

1. No terminal onde o Expo está rodando
2. Pressione **Ctrl+C** (Windows/Linux) ou **Cmd+C** (Mac)
3. Aguarde o servidor parar completamente

### 5.2. Iniciar Novamente

```bash
npx expo start
```

### 5.3. Verificar

1. O servidor deve iniciar sem erros
2. Não deve aparecer mensagens sobre variáveis não encontradas
3. Se aparecer erro, verifique o arquivo `.env`

---

## 📝 PASSO 6: Testar Integração (10 minutos)

### 6.1. Testar no App

1. Abra o app no seu dispositivo/emulador
2. Vá na tela **"Conexões"**
3. Clique no botão **"+"** (adicionar)
4. Selecione **"Plugg.to"** como provedor
5. Tente criar uma conexão

### 6.2. Verificar Logs

1. No app, clique em **"Ver Logs"**
2. Verifique se aparecem logs de tentativas de conexão
3. Se houver erros, veja a mensagem de erro

### 6.3. Possíveis Erros e Soluções

**Erro: "API Key inválida"**
- ✅ Verifique se copiou a chave corretamente
- ✅ Verifique se não há espaços extras
- ✅ Confirme se está usando a chave do ambiente correto (sandbox vs produção)

**Erro: "Unauthorized"**
- ✅ Verifique se o API Secret está correto
- ✅ Confirme se as credenciais são do mesmo ambiente

**Erro: "Base URL inválida"**
- ✅ Use `https://api.plugg.to` para produção
- ✅ Use `https://sandbox.plugg.to` para testes

---

## 📝 PASSO 7: Implementar Integração Real (4-6 horas)

### 7.1. Criar Arquivo do Provedor

Crie o arquivo `lib/services/providers/plugg.ts`:

```typescript
const PLUGG_API_KEY = process.env.EXPO_PUBLIC_PLUGG_API_KEY || '';
const PLUGG_API_SECRET = process.env.EXPO_PUBLIC_PLUGG_API_SECRET || '';
const PLUGG_BASE_URL = process.env.EXPO_PUBLIC_PLUGG_BASE_URL || 'https://api.plugg.to';

export class PluggProvider {
  /**
   * Cria link de autorização
   */
  static async createAuthLink(
    userId: string,
    bankCode: number,
    redirectUrl: string
  ): Promise<{ authUrl: string; connectionId: string }> {
    const response = await fetch(`${PLUGG_BASE_URL}/v1/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bank_code: bankCode,
        redirect_url: redirectUrl,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar link de autorização');
    }

    const data = await response.json();
    return {
      authUrl: data.auth_url,
      connectionId: data.connection_id,
    };
  }

  /**
   * Troca código de autorização por tokens
   */
  static async exchangeAuthCode(
    connectionId: string,
    authCode: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }> {
    const response = await fetch(`${PLUGG_BASE_URL}/v1/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUGG_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: connectionId,
        code: authCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao trocar código por tokens');
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    };
  }

  /**
   * Busca transações
   */
  static async fetchTransactions(
    accessToken: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());

    const response = await fetch(
      `${PLUGG_BASE_URL}/v1/transactions?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar transações');
    }

    const data = await response.json();
    return data.transactions || [];
  }

  /**
   * Busca saldo
   */
  static async fetchBalance(accessToken: string): Promise<number> {
    const response = await fetch(`${PLUGG_BASE_URL}/v1/balance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar saldo');
    }

    const data = await response.json();
    return data.balance || 0;
  }
}
```

### 7.2. Atualizar Componente de Nova Conexão

No arquivo `components/new-connection-modal.tsx`, atualize a função `handleCreateConnection`:

```typescript
import { PluggProvider } from '@/lib/services/providers/plugg';
import * as Linking from 'expo-linking';

const handleCreateConnection = async () => {
  // ... código existente ...

  try {
    // Criar conexão no banco
    const connection = await createOpenFinanceConnection(userId, {
      // ... dados ...
    });

    // Obter URL de autorização do Plugg
    const { authUrl, connectionId } = await PluggProvider.createAuthLink(
      userId,
      selectedBank!,
      Linking.createURL('/bank-connections/callback') // URL de callback
    );

    // Abrir URL no navegador
    await Linking.openURL(authUrl);

    // O usuário será redirecionado de volta após autorizar
    // Você precisará criar uma rota de callback para processar

    showSuccess('Redirecionando para autorização...');
  } catch (error: any) {
    showError(error.message);
  }
};
```

### 7.3. Criar Rota de Callback

Crie `app/bank-connections/callback.tsx` para processar o retorno:

```typescript
import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PluggProvider } from '@/lib/services/providers/plugg';
import { updateConnection } from '@/lib/services/open-finance';

export default function CallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { code, connection_id } = params;

  useEffect(() => {
    async function processCallback() {
      if (!code || !connection_id) {
        router.replace('/(tabs)/bank-connections');
        return;
      }

      try {
        // Trocar código por tokens
        const tokens = await PluggProvider.exchangeAuthCode(connection_id, code as string);

        // Atualizar conexão no banco
        await updateConnection(connection_id as string, {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_at: tokens.expiresAt,
          status: 'active',
        });

        // Redirecionar para tela de conexões
        router.replace('/(tabs)/bank-connections');
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        router.replace('/(tabs)/bank-connections');
      }
    }

    processCallback();
  }, []);

  return null;
}
```

---

## 📚 RECURSOS ÚTEIS

### Documentação Oficial
- **Site:** https://plugg.to
- **Documentação:** https://docs.plugg.to
- **API Reference:** https://docs.plugg.to/api-reference

### Suporte
- **Email:** suporte@plugg.to
- **Chat:** Disponível no site (se disponível)
- **Status:** https://status.plugg.to (verificar se API está funcionando)

### Exemplos de Código
- Verifique a documentação para exemplos em diferentes linguagens
- Procure por "SDK" ou "Quick Start"

---

## ✅ CHECKLIST FINAL

Antes de considerar configurado:

- [ ] Conta criada no Plugg.to
- [ ] Email confirmado
- [ ] Credenciais de API obtidas
- [ ] Variáveis adicionadas ao `.env`
- [ ] Servidor reiniciado
- [ ] Teste básico realizado
- [ ] Logs verificados
- [ ] Integração real implementada (opcional)

---

## 🎯 RESUMO RÁPIDO

1. **Criar conta:** https://plugg.to → Cadastrar
2. **Obter credenciais:** Dashboard → API/Credenciais
3. **Configurar `.env`:** Adicionar API_KEY, API_SECRET, BASE_URL
4. **Reiniciar servidor:** `npx expo start`
5. **Testar:** Criar conexão no app

**Tempo total:** ~30-45 minutos (sem implementação real)  
**Tempo com implementação:** ~5-6 horas

---

**Boa sorte! 🚀**

Se tiver dúvidas, consulte a documentação oficial ou entre em contato com o suporte do Plugg.to.
