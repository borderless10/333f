# 🚀 Guia Passo a Passo - Sprint 1: Integração Open Finance

## 📋 Visão Geral

Este guia vai te ajudar a implementar a integração Open Finance completa, incluindo:
- ✅ Criar/renovar/revogar consentimentos
- ✅ Importar transações e saldos
- ✅ Sistema de logs de integração

**Tempo estimado:** 16-20 horas

---

## 📝 PASSO 1: Configurar Banco de Dados (30 min)

### 1.1. Executar Script SQL

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `scripts/open-finance-setup.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run** (ou Ctrl+Enter)

**O que este script cria:**
- Tabela `bank_connections` (conexões Open Finance)
- Tabela `integration_logs` (logs de operações)
- Políticas RLS (segurança)
- Funções auxiliares

### 1.2. Verificar Criação

Execute no SQL Editor para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bank_connections', 'integration_logs');

-- Verificar estrutura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bank_connections';
```

✅ **Checkpoint:** Se as tabelas aparecerem, você está pronto para o próximo passo!

---

## 📝 PASSO 2: Configurar Variáveis de Ambiente (15 min)

### 2.1. Criar/Atualizar arquivo `.env`

Na raiz do projeto, crie ou atualize o arquivo `.env`:

```env
# Supabase (já deve existir)
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# Open Finance - Plugg.to (exemplo)
EXPO_PUBLIC_PLUGG_API_KEY=sua_api_key_aqui
EXPO_PUBLIC_PLUGG_API_SECRET=sua_api_secret_aqui
EXPO_PUBLIC_PLUGG_BASE_URL=https://api.plugg.to

# Open Finance - Belvo (alternativa)
EXPO_PUBLIC_BELVO_SECRET_ID=sua_secret_id_aqui
EXPO_PUBLIC_BELVO_SECRET_PASSWORD=sua_password_aqui
EXPO_PUBLIC_BELVO_BASE_URL=https://sandbox.belvo.com
```

**Nota:** Você precisará criar uma conta em um provedor Open Finance:
- **Plugg.to:** https://plugg.to (recomendado para Brasil)
- **Belvo:** https://belvo.com
- **Ou usar Open Banking direto** (mais complexo)

### 2.2. Reiniciar o servidor

```bash
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente
npx expo start
```

✅ **Checkpoint:** Variáveis configuradas!

---

## 📝 PASSO 3: Implementar Serviços de Integração (4-6 horas)

### 3.1. Arquivo já criado: `lib/services/open-finance.ts`

Este arquivo já contém todas as funções necessárias:
- ✅ `createOpenFinanceConnection` - Criar conexão
- ✅ `renewConsent` - Renovar consentimento
- ✅ `revokeConsent` - Revogar consentimento
- ✅ `importTransactions` - Importar transações
- ✅ `importBalance` - Importar saldo
- ✅ `logIntegrationOperation` - Registrar logs
- ✅ `getIntegrationLogs` - Buscar logs

### 3.2. Implementar Integração Real com API (4h)

**Opção A: Usar Plugg.to**

1. Criar arquivo `lib/services/providers/plugg.ts`:

```typescript
import { logIntegrationOperation } from '../open-finance';

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
    // TODO: Implementar chamada à API do Plugg
    // Documentação: https://docs.plugg.to
    
    // Exemplo de estrutura:
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
    // TODO: Implementar
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
    // TODO: Implementar
    const response = await fetch(
      `${PLUGG_BASE_URL}/v1/transactions?` +
      `start_date=${startDate?.toISOString()}&` +
      `end_date=${endDate?.toISOString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();
    return data.transactions || [];
  }

  /**
   * Busca saldo
   */
  static async fetchBalance(accessToken: string): Promise<number> {
    // TODO: Implementar
    const response = await fetch(`${PLUGG_BASE_URL}/v1/balance`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    return data.balance || 0;
  }
}
```

**Opção B: Modo Manual (para testes)**

Se você não tem acesso a uma API ainda, pode usar o modo manual que já está implementado.

✅ **Checkpoint:** Serviços implementados!

---

## 📝 PASSO 4: Componentes de UI (JÁ CRIADOS ✅)

### 4.1. Arquivos Criados:

✅ **`app/(tabs)/bank-connections.tsx`** - Tela principal de conexões
- Listar conexões existentes
- Criar nova conexão
- Renovar consentimento
- Revogar consentimento
- Importar transações manualmente
- Ver logs

✅ **`components/new-connection-modal.tsx`** - Modal de nova conexão
- Selecionar banco
- Selecionar conta bancária (se já cadastrada)
- Iniciar fluxo de autorização
- Mostrar status da conexão

✅ **`components/integration-logs-modal.tsx`** - Modal de logs
- Listar logs de integração
- Filtrar por tipo de operação
- Filtrar por status
- Ver detalhes de erros

✅ **Navegação atualizada** - Tab "Conexões" adicionada ao menu

✅ **Checkpoint:** UI criada e pronta para uso!

---

## 📝 PASSO 5: Integrar com Tela de Contas (2 horas)

### 5.1. Adicionar Botão "Conectar via Open Finance"

Na tela `app/(tabs)/accounts.tsx`, adicionar:

```typescript
// Botão para conectar via Open Finance
<TouchableOpacity
  onPress={() => setNewConnectionVisible(true)}
  style={styles.openFinanceButton}>
  <IconSymbol name="link.circle.fill" size={20} color="#00b09b" />
  <Text style={styles.openFinanceButtonText}>
    Conectar via Open Finance
  </Text>
</TouchableOpacity>
```

### 5.2. Mostrar Status de Conexão

Para cada conta bancária, mostrar se tem conexão Open Finance ativa.

✅ **Checkpoint:** Integração completa!

---

## 📝 PASSO 6: Testar Funcionalidades (2 horas)

### 6.1. Testar Criação de Conexão

1. Acesse a tela de Contas Bancárias
2. Clique em "Conectar via Open Finance"
3. Selecione um banco
4. Complete o fluxo de autorização
5. Verifique se a conexão aparece na lista

### 6.2. Testar Importação de Transações

1. Na lista de conexões, clique em "Importar Transações"
2. Selecione período
3. Clique em "Importar"
4. Verifique se transações aparecem na tela de Transações

### 6.3. Testar Logs

1. Acesse a tela de Logs
2. Verifique se todas as operações estão registradas
3. Teste filtros

### 6.4. Testar Renovação

1. Simule token expirado (ou aguarde expiração real)
2. Clique em "Renovar Consentimento"
3. Verifique se status volta para "active"

### 6.5. Testar Revogação

1. Clique em "Revogar Consentimento"
2. Verifique se status muda para "expired"
3. Verifique se não consegue mais importar

✅ **Checkpoint:** Tudo funcionando!

---

## 📝 PASSO 7: Adicionar ao Menu de Navegação (30 min)

### 7.1. Adicionar Tab de Conexões Bancárias

No arquivo `app/(tabs)/_layout.tsx`, adicionar:

```typescript
{
  name: 'bank-connections',
  title: 'Conexões',
  icon: 'link.circle.fill',
}
```

✅ **Checkpoint:** Menu atualizado!

---

## 🎯 Checklist Final

Antes de considerar o Sprint 1 completo, verifique:

- [ ] Script SQL executado com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] Serviços de integração implementados
- [ ] Tela de gerenciar conexões criada
- [ ] Modal de nova conexão funcionando
- [ ] Importação de transações funcionando
- [ ] Importação de saldo funcionando
- [ ] Sistema de logs funcionando
- [ ] Renovação de consentimento funcionando
- [ ] Revogação de consentimento funcionando
- [ ] Integração com tela de contas feita
- [ ] Testes realizados com sucesso
- [ ] Menu de navegação atualizado

---

## 🐛 Troubleshooting

### Erro: "Tabela não existe"
- **Solução:** Execute o script SQL novamente

### Erro: "Permission denied"
- **Solução:** Verifique as políticas RLS no Supabase

### Erro: "API Key inválida"
- **Solução:** Verifique as variáveis de ambiente

### Erro: "Token expirado"
- **Solução:** Implemente renovação automática de token

---

## 📚 Próximos Passos

Após completar o Sprint 1:

1. **Sprint 2:** Implementar tela de conciliação
2. **Melhorias:** Adicionar renovação automática de tokens
3. **Melhorias:** Adicionar sincronização automática periódica

---

**Boa sorte! 🚀**

Se tiver dúvidas, consulte:
- Documentação do Supabase: https://supabase.com/docs
- Documentação do Plugg.to: https://docs.plugg.to
- Documentação do Belvo: https://developers.belvo.com
