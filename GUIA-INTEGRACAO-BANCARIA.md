# 🏦 Guia de Integração Bancária - Borderless

## 📋 Visão Geral

Este documento descreve como integrar diferentes contas bancárias no aplicativo Borderless, permitindo sincronização automática de transações e saldos.

---

## 🎯 Opções de Integração Disponíveis

### 1. **Open Banking Brasil (Recomendado)**

#### O que é?
- Padrão regulado pelo Banco Central do Brasil
- Permite acesso seguro a dados bancários com consentimento do usuário
- APIs padronizadas para todos os bancos participantes

#### Vantagens:
✅ Regulamentado e seguro  
✅ Padrão único para todos os bancos  
✅ Gratuito (sem custos de API)  
✅ Conformidade com LGPD  

#### Desvantagens:
❌ Requer certificação no Banco Central  
❌ Processo de homologação demorado  
❌ Usuário precisa autorizar cada banco  

#### Como Funciona:
1. Usuário autoriza acesso via app do banco
2. Recebemos token de acesso (OAuth 2.0)
3. Fazemos requisições às APIs do banco
4. Sincronizamos transações e saldos

---

### 2. **Agregadores de Dados (Mais Rápido)**

#### Opções Disponíveis:

##### **Plugg.to** 🇧🇷
- Foco no mercado brasileiro
- Suporta principais bancos
- API simples e bem documentada
- **Custo**: R$ 0,50 - R$ 2,00 por conta/mês

##### **Belvo** 🌎
- Internacional (Brasil, México, Colômbia)
- Interface moderna
- Boa documentação
- **Custo**: $0,10 - $0,50 por conta/mês

##### **Yapily** 🌍
- Foco internacional
- Suporta Open Banking Brasil
- **Custo**: Variável

##### **Guiabolso Connect** 🇧🇷
- Brasileiro
- Foco em PF (Pessoa Física)
- **Custo**: Contato comercial

#### Vantagens:
✅ Implementação rápida (1-2 semanas)  
✅ Suporte técnico  
✅ Manutenção da conexão  
✅ Dashboard de monitoramento  

#### Desvantagens:
❌ Custo mensal por conta  
❌ Dependência de terceiros  
❌ Taxa de sucesso pode variar  

---

## 🏗️ Arquitetura Proposta

### Estrutura de Dados

```typescript
// lib/services/bank-integrations.ts

export interface BankConnection {
  id: string;
  userId: string;
  bankCode: number; // Código do banco (ex: 001 = Banco do Brasil)
  bankName: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'investment';
  provider: 'open_banking' | 'plugg' | 'belvo' | 'manual';
  accessToken?: string; // Para Open Banking
  refreshToken?: string;
  expiresAt?: Date;
  lastSyncAt?: Date;
  status: 'active' | 'expired' | 'error' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface BankTransaction {
  id: string;
  connectionId: string;
  bankTransactionId: string; // ID da transação no banco
  description: string;
  amount: number;
  date: Date;
  type: 'credit' | 'debit';
  category?: string;
  balance?: number;
  rawData?: any; // Dados brutos da API
}
```

### Tabela no Supabase

```sql
-- Tabela de conexões bancárias
CREATE TABLE bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  bank_code INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('checking', 'savings', 'investment')),
  provider TEXT NOT NULL CHECK (provider IN ('open_banking', 'plugg', 'belvo', 'manual')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'error', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de transações sincronizadas
CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE,
  bank_transaction_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  date DATE NOT NULL,
  type TEXT CHECK (type IN ('credit', 'debit')),
  category TEXT,
  balance DECIMAL(15, 2),
  raw_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, bank_transaction_id)
);

-- Índices
CREATE INDEX idx_bank_connections_user ON bank_connections(user_id);
CREATE INDEX idx_bank_transactions_connection ON bank_transactions(connection_id);
CREATE INDEX idx_bank_transactions_date ON bank_transactions(date DESC);
```

---

## 🚀 Implementação Passo a Passo

### Fase 1: Preparação (Semana 1)

#### 1.1 Escolher Provider
- **Recomendação**: Começar com **Plugg.to** (mais rápido)
- Criar conta e obter API keys
- Testar em ambiente sandbox

#### 1.2 Atualizar Schema do Banco
```bash
# Executar migrations no Supabase
# Adicionar tabelas bank_connections e bank_transactions
```

#### 1.3 Criar Variáveis de Ambiente
```env
# .env
PLUGG_API_KEY=your_api_key
PLUGG_API_SECRET=your_api_secret
PLUGG_WEBHOOK_SECRET=your_webhook_secret
```

---

### Fase 2: Backend (Semana 2)

#### 2.1 Criar Serviço de Integração

```typescript
// lib/services/bank-integrations.ts

import { supabase } from '../supabase';

export class BankIntegrationService {
  private provider: 'plugg' | 'belvo' | 'open_banking';

  constructor(provider: 'plugg' | 'belvo' | 'open_banking') {
    this.provider = provider;
  }

  // Criar link de conexão
  async createConnectionLink(userId: string, bankCode: number) {
    // Implementar conforme provider escolhido
  }

  // Sincronizar transações
  async syncTransactions(connectionId: string) {
    // Buscar transações do banco
    // Salvar no Supabase
    // Atualizar last_sync_at
  }

  // Atualizar saldo
  async updateBalance(connectionId: string) {
    // Buscar saldo atual
    // Atualizar na conta bancária
  }
}
```

#### 2.2 Criar Endpoints (Supabase Edge Functions)

```typescript
// supabase/functions/sync-bank-account/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // 1. Validar autenticação
  // 2. Buscar conexões ativas do usuário
  // 3. Sincronizar cada conta
  // 4. Retornar resultado
});
```

---

### Fase 3: Frontend (Semana 3)

#### 3.1 Tela de Conectar Banco

```typescript
// app/(tabs)/bank-connections.tsx

export default function BankConnectionsScreen() {
  const [banks, setBanks] = useState([]);
  const [connecting, setConnecting] = useState(false);

  const connectBank = async (bankCode: number) => {
    // 1. Criar link de conexão
    // 2. Abrir webview para autorização
    // 3. Receber callback com token
    // 4. Salvar conexão
  };

  return (
    <View>
      {/* Lista de bancos disponíveis */}
      {/* Botão "Conectar" para cada banco */}
    </View>
  );
}
```

#### 3.2 Sincronização Automática

```typescript
// hooks/use-bank-sync.ts

export function useBankSync() {
  useEffect(() => {
    // Sincronizar a cada 1 hora
    const interval = setInterval(() => {
      syncAllAccounts();
    }, 3600000); // 1 hora

    return () => clearInterval(interval);
  }, []);
}
```

---

## 📱 Fluxo de Usuário

### 1. Conectar Banco
```
Usuário → Seleciona banco → Autoriza no app do banco → 
Conexão criada → Primeira sincronização automática
```

### 2. Sincronização Automática
```
App verifica a cada hora → Busca novas transações → 
Atualiza saldo → Notifica usuário (opcional)
```

### 3. Visualizar Transações
```
Dashboard → Mostra transações de todas as contas → 
Filtro por banco/conta → Detalhes da transação
```

---

## 🔒 Segurança

### Boas Práticas:
1. **Tokens**: Nunca armazenar tokens em texto plano
2. **Criptografia**: Criptografar tokens no banco
3. **Refresh Tokens**: Renovar automaticamente antes de expirar
4. **Webhooks**: Validar assinatura de webhooks
5. **Rate Limiting**: Limitar requisições por usuário
6. **Logs**: Registrar todas as operações (sem dados sensíveis)

---

## 💰 Custos Estimados

### Plugg.to
- **Setup**: R$ 0
- **Por conta conectada**: R$ 0,50 - R$ 2,00/mês
- **Transações**: Incluídas

### Belvo
- **Setup**: $0
- **Por conta**: $0,10 - $0,50/mês
- **Transações**: Incluídas

### Open Banking
- **Setup**: Gratuito (mas requer certificação)
- **Uso**: Gratuito
- **Manutenção**: Tempo de desenvolvimento

---

## 🎯 Recomendação Final

### Para MVP (Rápido):
1. **Começar com Plugg.to**
   - Implementação: 2-3 semanas
   - Custo baixo
   - Suporte brasileiro

### Para Escala (Longo Prazo):
1. **Migrar para Open Banking**
   - Sem custos recorrentes
   - Mais controle
   - Padrão regulamentado

### Híbrido (Ideal):
1. **Plugg.to** para começar rápido
2. **Open Banking** para bancos principais (Itaú, Bradesco, BB)
3. **Manual** como fallback

---

## 📚 Recursos

- [Open Banking Brasil](https://www.bcb.gov.br/estabilidadefinanceira/openbanking)
- [Plugg.to Docs](https://docs.plugg.to)
- [Belvo Docs](https://developers.belvo.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

## ✅ Checklist de Implementação

- [ ] Escolher provider (Plugg.to recomendado)
- [ ] Criar conta e obter API keys
- [ ] Atualizar schema do banco (tabelas)
- [ ] Criar serviço de integração (backend)
- [ ] Criar Edge Function para sincronização
- [ ] Criar tela de conexão de bancos
- [ ] Implementar webhook handler
- [ ] Testar fluxo completo
- [ ] Implementar sincronização automática
- [ ] Adicionar tratamento de erros
- [ ] Documentar para usuários

---

**Última atualização**: Janeiro 2025
