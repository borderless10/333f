# 🗺️ ROADMAP DE IMPLEMENTAÇÃO - PASSO A PASSO

## 📌 Visão Geral

Este documento detalha a ordem recomendada de implementação das funcionalidades faltantes, organizadas por prioridade e dependências técnicas.

---

## 🎯 FASE 1: CORREÇÕES CRÍTICAS E AJUSTES DE ARQUITETURA (10-15h)

### **Semana 1 - Dias 1-2**

#### ✅ **Passo 1.1: Correção da Regra de Duplicidade de CNPJ** (3-4h)
**Por quê?** Problema crítico que afeta a lógica de negócio fundamental.

**Implementação:**
```sql
-- 1. Adicionar campo empresa_telos_id nas tabelas (1h)
ALTER TABLE empresas ADD COLUMN empresa_telos_id UUID REFERENCES empresas_telos(id);
ALTER TABLE usuarios ADD COLUMN empresa_telos_id UUID REFERENCES empresas_telos(id);

-- 2. Criar tabela empresas_telos se não existir (30min)
CREATE TABLE IF NOT EXISTS empresas_telos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Atualizar constraint de CNPJ (30min)
ALTER TABLE empresas DROP CONSTRAINT IF EXISTS empresas_cnpj_key;
CREATE UNIQUE INDEX empresas_cnpj_empresa_telos_idx 
  ON empresas(cnpj, empresa_telos_id) 
  WHERE empresa_telos_id IS NOT NULL;
```

**Código TypeScript:**
```typescript
// lib/services/companies.ts
// 4. Atualizar validação de CNPJ (1h)
export async function validarCNPJDuplicado(
  cnpj: string, 
  empresaTelosId: string, 
  empresaId?: number
): Promise<boolean> {
  const { data, error } = await supabase
    .from('empresas')
    .select('id')
    .eq('cnpj', limparCNPJ(cnpj))
    .eq('empresa_telos_id', empresaTelosId)
    .neq('id', empresaId || 0);
  
  return (data?.length || 0) > 0;
}
```

**Testes:**
- [ ] Criar empresa A com CNPJ X na Télos Control
- [ ] Criar empresa B com CNPJ X na Empresa Y (deve permitir)
- [ ] Tentar criar empresa C com CNPJ X na Télos Control (deve bloquear)

---

#### ✅ **Passo 1.2: Implementar Seletor de Contexto Empresarial** (6-8h)
**Por quê?** Fundamental para o fluxo de trabalho do analista.

**Implementação:**

```typescript
// 1. Criar contexto de Empresa (2h)
// contexts/CompanyContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface CompanyContextData {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  companies: Company[];
  loadCompanies: () => Promise<void>;
}

export function CompanyProvider({ children }) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  useEffect(() => {
    loadCompanies();
    loadSavedContext();
  }, []);
  
  const loadSavedContext = async () => {
    const saved = await AsyncStorage.getItem('selectedCompanyId');
    if (saved) {
      const company = companies.find(c => c.id === parseInt(saved));
      if (company) setSelectedCompany(company);
    }
  };
  
  const handleSetCompany = async (company: Company | null) => {
    setSelectedCompany(company);
    if (company) {
      await AsyncStorage.setItem('selectedCompanyId', company.id.toString());
    }
  };
  
  return (
    <CompanyContext.Provider value={{
      selectedCompany,
      setSelectedCompany: handleSetCompany,
      companies,
      loadCompanies
    }}>
      {children}
    </CompanyContext.Provider>
  );
}
```

```typescript
// 2. Criar componente CompanySelector (3-4h)
// components/CompanySelector.tsx
export function CompanySelector() {
  const { companies, selectedCompany, setSelectedCompany } = useCompany();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <View style={styles.selectorButton}>
          <IconSymbol name="building.2" size={20} color="#00b09b" />
          <Text style={styles.companyName}>
            {selectedCompany?.razao_social || 'Selecionar Empresa'}
          </Text>
          <IconSymbol name="chevron.down" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
      
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            placeholder="Buscar empresa..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          
          <FlatList
            data={companies.filter(c => 
              c.razao_social.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCompany(item);
                  setModalVisible(false);
                }}
                style={styles.companyItem}>
                <Text>{item.razao_social}</Text>
                {selectedCompany?.id === item.id && (
                  <IconSymbol name="checkmark" size={20} color="#00b09b" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}
```

```typescript
// 3. Adicionar no Header (1-2h)
// app/(tabs)/_layout.tsx
<Stack.Screen
  name="index"
  options={{
    title: 'Dashboard',
    headerRight: () => <CompanySelector />
  }}
/>
```

**Testes:**
- [ ] Abrir seletor de contexto
- [ ] Buscar empresa
- [ ] Selecionar empresa
- [ ] Verificar se contexto persiste ao recarregar app
- [ ] Verificar se dados do dashboard atualizam

---

## 🎯 FASE 2: SISTEMA DE CONCILIAÇÃO (50-63h)

### **Semana 1 - Dias 3-5 + Semana 2 Completa**

#### ✅ **Passo 2.1: Estrutura de Banco de Dados** (4-5h)

```sql
-- 1. Criar tabela de conciliações (2h)
CREATE TABLE IF NOT EXISTS conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  transacao_id BIGINT REFERENCES transacoes(id) ON DELETE CASCADE,
  titulo_id BIGINT REFERENCES titulos(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('conciliado', 'conciliado_com_diferenca')),
  diferenca_valor DECIMAL(15, 2) DEFAULT 0,
  diferenca_dias INTEGER DEFAULT 0,
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  data_conciliacao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de histórico (1h)
CREATE TABLE IF NOT EXISTS historico_conciliacoes (
  id BIGSERIAL PRIMARY KEY,
  conciliacao_id BIGINT REFERENCES conciliacoes(id) ON DELETE CASCADE,
  acao TEXT NOT NULL CHECK (acao IN ('criada', 'desfeita', 'editada')),
  usuario_id UUID REFERENCES auth.users(id),
  data_acao TIMESTAMPTZ DEFAULT NOW(),
  dados_anteriores JSONB
);

-- 3. Índices (30min)
CREATE INDEX idx_conciliacoes_transacao ON conciliacoes(transacao_id);
CREATE INDEX idx_conciliacoes_titulo ON conciliacoes(titulo_id);
CREATE INDEX idx_conciliacoes_status ON conciliacoes(status);
CREATE INDEX idx_historico_conciliacao ON historico_conciliacoes(conciliacao_id);

-- 4. RLS (30min)
ALTER TABLE conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_conciliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas conciliações"
  ON conciliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transacoes t
      WHERE t.id = conciliacoes.transacao_id
      AND t.codigo_empresa = auth.uid()::text
    )
  );
```

---

#### ✅ **Passo 2.2: Criar Serviço de Conciliação** (6-8h)

```typescript
// lib/services/reconciliation.ts

export interface Reconciliation {
  id: number;
  transacao_id: number;
  titulo_id: number;
  status: 'conciliado' | 'conciliado_com_diferenca';
  diferenca_valor: number;
  diferenca_dias: number;
  observacoes?: string;
}

// 1. Buscar itens pendentes (2h)
export async function buscarItensPendentes(empresaId: string) {
  const { data: transacoes, error: errorT } = await supabase
    .from('transacoes')
    .select('*')
    .eq('codigo_empresa', empresaId)
    .is('conciliado', null)
    .order('data', { ascending: false });
    
  const { data: titulos, error: errorTit } = await supabase
    .from('titulos')
    .select('*')
    .eq('codigo_empresa', empresaId)
    .eq('status', 'pendente')
    .order('data_vencimento', { ascending: false });
    
  return {
    transacoes: transacoes || [],
    titulos: titulos || [],
  };
}

// 2. Sugerir matches automáticos (3-4h)
export async function sugerirMatches(
  transacao: Transaction,
  titulos: Titulo[],
  toleranciaValor: number = 0.01, // 1 centavo
  toleranciaDias: number = 3
) {
  return titulos.filter(titulo => {
    const diferencaValor = Math.abs(transacao.valor - titulo.valor);
    const diferencaDias = Math.abs(
      differenceInDays(new Date(transacao.data), new Date(titulo.data_vencimento))
    );
    
    return (
      diferencaValor <= toleranciaValor &&
      diferencaDias <= toleranciaDias &&
      ((transacao.tipo === 'receita' && titulo.tipo === 'receber') ||
       (transacao.tipo === 'despesa' && titulo.tipo === 'pagar'))
    );
  });
}

// 3. Conciliar (2h)
export async function conciliar(
  transacaoId: number,
  tituloId: number,
  observacoes?: string
): Promise<{ data: Reconciliation | null; error: any }> {
  // Buscar transação e título
  const { data: transacao } = await supabase
    .from('transacoes')
    .select('*')
    .eq('id', transacaoId)
    .single();
    
  const { data: titulo } = await supabase
    .from('titulos')
    .select('*')
    .eq('id', tituloId)
    .single();
  
  if (!transacao || !titulo) {
    return { data: null, error: 'Transação ou título não encontrado' };
  }
  
  // Calcular diferenças
  const diferencaValor = Math.abs(transacao.valor - titulo.valor);
  const diferencaDias = differenceInDays(
    new Date(transacao.data),
    new Date(titulo.data_vencimento)
  );
  
  const status = diferencaValor === 0 ? 'conciliado' : 'conciliado_com_diferenca';
  
  // Criar conciliação
  const { data, error } = await supabase
    .from('conciliacoes')
    .insert({
      transacao_id: transacaoId,
      titulo_id: tituloId,
      status,
      diferenca_valor: diferencaValor,
      diferenca_dias: diferencaDias,
      observacoes,
      usuario_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();
    
  if (!error) {
    // Registrar histórico
    await supabase.from('historico_conciliacoes').insert({
      conciliacao_id: data.id,
      acao: 'criada',
      usuario_id: (await supabase.auth.getUser()).data.user?.id,
    });
  }
  
  return { data, error };
}

// 4. Desfazer conciliação (1h)
export async function desfazerConciliacao(conciliacaoId: number) {
  // Buscar dados antes de deletar
  const { data: conciliacao } = await supabase
    .from('conciliacoes')
    .select('*')
    .eq('id', conciliacaoId)
    .single();
    
  // Registrar histórico
  await supabase.from('historico_conciliacoes').insert({
    conciliacao_id: conciliacaoId,
    acao: 'desfeita',
    usuario_id: (await supabase.auth.getUser()).data.user?.id,
    dados_anteriores: conciliacao,
  });
  
  // Deletar conciliação
  const { error } = await supabase
    .from('conciliacoes')
    .delete()
    .eq('id', conciliacaoId);
    
  return { error };
}
```

---

#### ✅ **Passo 2.3: Criar Tela de Conciliação** (20-25h)

```typescript
// app/(tabs)/reconciliation.tsx

export default function ReconciliationScreen() {
  const [transacoesPendentes, setTransacoesPendentes] = useState<Transaction[]>([]);
  const [titulosPendentes, setTitulosPendentes] = useState<Titulo[]>([]);
  const [transacaoSelecionada, setTransacaoSelecionada] = useState<Transaction | null>(null);
  const [tituloSelecionado, setTituloSelecionado] = useState<Titulo | null>(null);
  const [matchesSugeridos, setMatchesSugeridos] = useState<Titulo[]>([]);
  
  // 1. Layout duas colunas (5-6h)
  return (
    <View style={styles.container}>
      <AnimatedBackground />
      
      {/* Header com filtros */}
      <View style={styles.header}>
        <CompanySelector />
        <DateRangePicker />
        <AccountFilter />
      </View>
      
      {/* Cards de resumo */}
      <ScrollView horizontal>
        <Card title="Dias em Aberto" value={diasEmAberto} />
        <Card title="Valor Desconciliado" value={formatCurrency(valorDesconciliado)} />
        <Card title="Pendentes" value={totalPendentes} />
      </ScrollView>
      
      {/* Duas colunas */}
      <View style={styles.columns}>
        {/* Coluna Esquerda: Transações Bancárias */}
        <ScrollView style={styles.column}>
          <ThemedText type="subtitle">Transações Bancárias</ThemedText>
          {transacoesPendentes.map(transacao => (
            <TransactionCard
              key={transacao.id}
              transacao={transacao}
              isSelected={transacaoSelecionada?.id === transacao.id}
              onSelect={() => {
                setTransacaoSelecionada(transacao);
                // Buscar matches sugeridos
                const matches = sugerirMatches(transacao, titulosPendentes);
                setMatchesSugeridos(matches);
              }}
              suggestedMatches={
                transacaoSelecionada?.id === transacao.id ? matchesSugeridos : []
              }
            />
          ))}
        </ScrollView>
        
        {/* Coluna Direita: Títulos ERP */}
        <ScrollView style={styles.column}>
          <ThemedText type="subtitle">Lançamentos ERP</ThemedText>
          {titulosPendentes.map(titulo => (
            <TituloCard
              key={titulo.id}
              titulo={titulo}
              isSelected={tituloSelecionado?.id === titulo.id}
              isSuggested={matchesSugeridos.some(m => m.id === titulo.id)}
              onSelect={() => setTituloSelecionado(titulo)}
            />
          ))}
        </ScrollView>
      </View>
      
      {/* Botão Conciliar (aparece quando ambos estão selecionados) */}
      {transacaoSelecionada && tituloSelecionado && (
        <TouchableOpacity
          style={styles.reconcileButton}
          onPress={handleReconcile}>
          <Text>Conciliar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// 2. Cards de Transação e Título (4-5h)
function TransactionCard({ transacao, isSelected, onSelect, suggestedMatches }) {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{transacao.descricao}</Text>
        <Text style={styles.cardAmount}>
          {formatCurrency(transacao.valor)}
        </Text>
      </View>
      <Text style={styles.cardDate}>{formatDate(transacao.data)}</Text>
      <Text style={styles.cardAccount}>{transacao.conta_bancaria}</Text>
      
      {suggestedMatches.length > 0 && (
        <View style={styles.suggestions}>
          <IconSymbol name="lightbulb" size={16} color="#FBBF24" />
          <Text style={styles.suggestionsText}>
            {suggestedMatches.length} sugestões
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// 3. Modal de Confirmação (3-4h)
function ReconcileModal({ transacao, titulo, onConfirm, onCancel }) {
  const diferencaValor = Math.abs(transacao.valor - titulo.valor);
  const diferencaDias = differenceInDays(
    new Date(transacao.data),
    new Date(titulo.data_vencimento)
  );
  
  return (
    <Modal visible animationType="slide">
      <View style={styles.modalContainer}>
        <ThemedText type="title">Confirmar Conciliação</ThemedText>
        
        <View style={styles.comparisonContainer}>
          {/* Transação */}
          <View style={styles.comparisonColumn}>
            <Text style={styles.comparisonLabel}>Transação Bancária</Text>
            <Text>{transacao.descricao}</Text>
            <Text>{formatCurrency(transacao.valor)}</Text>
            <Text>{formatDate(transacao.data)}</Text>
          </View>
          
          {/* Seta de comparação */}
          <IconSymbol name="arrow.left.arrow.right" size={24} />
          
          {/* Título */}
          <View style={styles.comparisonColumn}>
            <Text style={styles.comparisonLabel}>Lançamento ERP</Text>
            <Text>{titulo.descricao}</Text>
            <Text>{formatCurrency(titulo.valor)}</Text>
            <Text>{formatDate(titulo.data_vencimento)}</Text>
          </View>
        </View>
        
        {/* Diferenças */}
        {(diferencaValor > 0 || diferencaDias > 0) && (
          <View style={styles.differencesContainer}>
            <Text style={styles.warningText}>⚠️ Atenção às diferenças:</Text>
            {diferencaValor > 0 && (
              <Text>Diferença de valor: {formatCurrency(diferencaValor)}</Text>
            )}
            {diferencaDias > 0 && (
              <Text>Diferença de {diferencaDias} dias</Text>
            )}
          </View>
        )}
        
        {/* Observações */}
        <TextInput
          placeholder="Observações (opcional)"
          style={styles.observacoesInput}
          multiline
        />
        
        {/* Botões */}
        <View style={styles.modalButtons}>
          <Button title="Cancelar" onPress={onCancel} variant="secondary" />
          <Button title="Confirmar" onPress={onConfirm} />
        </View>
      </View>
    </Modal>
  );
}

// 4. Lógica de conciliação (3-4h)
const handleReconcile = async () => {
  if (!transacaoSelecionada || !tituloSelecionado) return;
  
  setModalVisible(true);
};

const confirmarConciliacao = async (observacoes?: string) => {
  setLoading(true);
  
  const { data, error } = await conciliar(
    transacaoSelecionada!.id,
    tituloSelecionado!.id,
    observacoes
  );
  
  if (error) {
    Alert.alert('Erro', 'Não foi possível conciliar');
  } else {
    // Toast de sucesso
    showToast('Conciliação realizada com sucesso!', 'success');
    
    // Limpar seleções
    setTransacaoSelecionada(null);
    setTituloSelecionado(null);
    
    // Recarregar lista
    await loadPendentes();
  }
  
  setLoading(false);
  setModalVisible(false);
};

// 5. Visualização de conciliados (4-5h)
// Tab para mostrar items já conciliados
<Tab.Screen name="conciliados">
  <FlatList
    data={conciliados}
    renderItem={({ item }) => (
      <ConciliadoCard
        conciliacao={item}
        onUndo={() => handleDesfazer(item.id)}
      />
    )}
  />
</Tab.Screen>
```

---

#### ✅ **Passo 2.4: Dashboard de Diferenças** (5-7h)

```typescript
// Adicionar tab "Diferenças" na tela de Conciliação

function DiferençasTab() {
  return (
    <ScrollView>
      {/* Resumo */}
      <GlassContainer>
        <Text>Total Conciliado: {formatCurrency(totalConciliado)}</Text>
        <Text>Total Pendente: {formatCurrency(totalPendente)}</Text>
        <Text>Taxa de Conciliação: {percentualConciliado}%</Text>
      </GlassContainer>
      
      {/* Sobras (transações sem match) */}
      <ThemedText type="subtitle">Sobras</ThemedText>
      <Text style={styles.description}>
        Transações bancárias sem lançamento correspondente
      </Text>
      {sobras.map(transacao => (
        <TransactionCard key={transacao.id} transacao={transacao} />
      ))}
      
      {/* Faltas (títulos sem match) */}
      <ThemedText type="subtitle">Faltas</ThemedText>
      <Text style={styles.description}>
        Lançamentos ERP sem transação correspondente
      </Text>
      {faltas.map(titulo => (
        <TituloCard key={titulo.id} titulo={titulo} />
      ))}
      
      {/* Botão exportar */}
      <Button
        title="Exportar Diferenças (CSV)"
        onPress={exportarDiferencas}
      />
    </ScrollView>
  );
}
```

---

## 🎯 FASE 3: INTEGRAÇÃO OPEN FINANCE (40-50h)

### **Semana 3 Completa**

#### ✅ **Passo 3.1: Configuração Inicial Pluggy** (6-8h)

```typescript
// 1. Criar conta Pluggy (30min)
// - Acessar https://pluggy.ai
// - Criar conta
// - Obter Client ID e Client Secret

// 2. Configurar variáveis de ambiente (15min)
// .env
EXPO_PUBLIC_PLUGGY_CLIENT_ID=your_client_id
EXPO_PUBLIC_PLUGGY_CLIENT_SECRET=your_client_secret

// 3. Criar serviço base (3-4h)
// lib/services/open-finance.ts

import axios from 'axios';

const PLUGGY_API_URL = 'https://api.pluggy.ai';

// Autenticar e obter token
async function getPluggyToken() {
  const response = await axios.post(`${PLUGGY_API_URL}/auth`, {
    clientId: process.env.EXPO_PUBLIC_PLUGGY_CLIENT_ID,
    clientSecret: process.env.EXPO_PUBLIC_PLUGGY_CLIENT_SECRET,
  });
  
  return response.data.apiKey;
}

// Listar bancos disponíveis
export async function listarBancos() {
  const token = await getPluggyToken();
  
  const response = await axios.get(`${PLUGGY_API_URL}/connectors`, {
    headers: { 'X-API-KEY': token },
  });
  
  return response.data.results;
}

// 4. Criar tabelas no banco (2-3h)
```

```sql
-- Tabela de conexões bancárias
CREATE TABLE IF NOT EXISTS conexoes_bancarias (
  id BIGSERIAL PRIMARY KEY,
  codigo_empresa TEXT NOT NULL,
  banco_codigo TEXT NOT NULL,
  banco_nome TEXT NOT NULL,
  pluggy_item_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ativa', 'erro', 'expirada', 'revogada')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  expira_em TIMESTAMPTZ
);

-- Tabela de consentimentos
CREATE TABLE IF NOT EXISTS consentimentos_open_finance (
  id BIGSERIAL PRIMARY KEY,
  conexao_bancaria_id BIGINT REFERENCES conexoes_bancarias(id),
  codigo_empresa TEXT NOT NULL,
  consentimento_id TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ativo', 'revogado', 'expirado')),
  escopos TEXT[] NOT NULL,
  data_inicio TIMESTAMPTZ NOT NULL,
  data_expiracao TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS logs_integracao (
  id BIGSERIAL PRIMARY KEY,
  conexao_bancaria_id BIGINT REFERENCES conexoes_bancarias(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('importacao', 'consentimento', 'erro')),
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'processando')),
  mensagem TEXT,
  detalhes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE conexoes_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE consentimentos_open_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_integracao ENABLE ROW LEVEL SECURITY;

-- Políticas...
```

---

#### ✅ **Passo 3.2: Gestão de Consentimentos** (12-15h)

```typescript
// 1. Criar fluxo de consentimento (8-10h)
// app/(tabs)/bank-connections.tsx

export default function BankConnectionsScreen() {
  const [bancos, setBancos] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  return (
    <View>
      {/* Lista de conexões existentes */}
      <ThemedText type="title">Minhas Conexões</ThemedText>
      {conexoes.map(conexao => (
        <ConnectionCard
          key={conexao.id}
          conexao={conexao}
          onRenew={() => renovarConsentimento(conexao.id)}
          onRevoke={() => revogarConsentimento(conexao.id)}
        />
      ))}
      
      {/* Botão adicionar nova conexão */}
      <Button
        title="Conectar Novo Banco"
        onPress={() => setModalVisible(true)}
      />
      
      {/* Modal de seleção de banco */}
      <Modal visible={modalVisible}>
        <BankSelector
          bancos={bancos}
          onSelect={handleBancoSelecionado}
        />
      </Modal>
    </View>
  );
}

// 2. Widget de autenticação Pluggy (4-5h)
async function handleBancoSelecionado(banco) {
  // Criar item no Pluggy
  const token = await getPluggyToken();
  
  const response = await axios.post(
    `${PLUGGY_API_URL}/connect/token`,
    {
      connectorId: banco.id,
    },
    {
      headers: { 'X-API-KEY': token },
    }
  );
  
  const connectToken = response.data.accessToken;
  
  // Abrir webview ou modal com widget Pluggy
  const pluggyUrl = `https://connect.pluggy.ai?connectToken=${connectToken}`;
  
  // Implementar webview nativa ou usar Linking
  await Linking.openURL(pluggyUrl);
  
  // Aguardar callback (webhook do Pluggy)
}

// 3. Processar retorno e salvar conexão (2-3h)
// Webhook endpoint no backend ou polling no frontend
```

---

#### ✅ **Passo 3.3: Importação de Transações** (15-20h)

```typescript
// 1. Botão importar na tela de Contas (2-3h)
// app/(tabs)/accounts.tsx

// Adicionar botão em cada conta
<Button
  title="Importar Transações"
  onPress={() => openImportModal(conta)}
  icon={<IconSymbol name="arrow.down.circle" />}
/>

// 2. Modal de importação (5-6h)
function ImportTransactionsModal({ conta, conexao }) {
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' });
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  
  return (
    <Modal visible>
      <ThemedText type="title">Importar Transações</ThemedText>
      
      <DateRangePicker
        value={periodo}
        onChange={setPeriodo}
      />
      
      <Text>Conta: {conta.descricao}</Text>
      <Text>Banco: {conexao.banco_nome}</Text>
      
      {importando && (
        <View>
          <ProgressBar progress={progresso} />
          <Text>{progresso}% concluído</Text>
        </View>
      )}
      
      <Button
        title="Importar"
        onPress={handleImport}
        loading={importando}
      />
    </Modal>
  );
}

// 3. Lógica de importação (8-10h)
async function handleImport() {
  setImportando(true);
  
  try {
    const token = await getPluggyToken();
    
    // Buscar transações do Pluggy
    const response = await axios.get(
      `${PLUGGY_API_URL}/accounts/${conta.pluggy_account_id}/transactions`,
      {
        headers: { 'X-API-KEY': token },
        params: {
          from: periodo.inicio,
          to: periodo.fim,
        },
      }
    );
    
    const transacoesPluggy = response.data.results;
    
    // Normalizar dados
    const transacoesNormalizadas = transacoesPluggy.map(t => ({
      codigo_empresa: userId,
      descricao: t.description,
      valor: Math.abs(t.amount),
      data: t.date,
      tipo: t.amount > 0 ? 'receita' : 'despesa',
      categoria: 'Importado Open Finance',
      conta_bancaria_id: conta.id,
      pluggy_transaction_id: t.id, // Para deduplicação
    }));
    
    // Verificar duplicatas
    const { data: existentes } = await supabase
      .from('transacoes')
      .select('pluggy_transaction_id')
      .in('pluggy_transaction_id', transacoesNormalizadas.map(t => t.pluggy_transaction_id));
    
    const existentesIds = new Set(existentes?.map(e => e.pluggy_transaction_id) || []);
    
    const novasTransacoes = transacoesNormalizadas.filter(
      t => !existentesIds.has(t.pluggy_transaction_id)
    );
    
    // Inserir em lote
    let importadas = 0;
    for (const transacao of novasTransacoes) {
      await supabase.from('transacoes').insert(transacao);
      importadas++;
      setProgresso((importadas / novasTransacoes.length) * 100);
    }
    
    // Registrar log
    await supabase.from('logs_integracao').insert({
      conexao_bancaria_id: conexao.id,
      tipo: 'importacao',
      status: 'sucesso',
      mensagem: `${importadas} transações importadas`,
      detalhes: {
        periodo,
        total_pluggy: transacoesPluggy.length,
        duplicatas: transacoesPluggy.length - novasTransacoes.length,
        importadas,
      },
    });
    
    showToast(`${importadas} transações importadas com sucesso!`, 'success');
    
  } catch (error) {
    // Registrar log de erro
    await supabase.from('logs_integracao').insert({
      conexao_bancaria_id: conexao.id,
      tipo: 'importacao',
      status: 'erro',
      mensagem: error.message,
      detalhes: { error: error.toString() },
    });
    
    Alert.alert('Erro', 'Falha ao importar transações');
  } finally {
    setImportando(false);
  }
}

// 4. Importar saldos (2-3h)
async function importarSaldos(conta, conexao) {
  const token = await getPluggyToken();
  
  const response = await axios.get(
    `${PLUGGY_API_URL}/accounts/${conta.pluggy_account_id}`,
    {
      headers: { 'X-API-KEY': token },
    }
  );
  
  const saldo = response.data.balance;
  
  // Atualizar conta com saldo
  await supabase
    .from('contas_bancarias')
    .update({ saldo_atual: saldo, ultima_sincronizacao: new Date() })
    .eq('id', conta.id);
}
```

---

#### ✅ **Passo 3.4: Tela de Logs** (7-10h)

```typescript
// app/(tabs)/integration-logs.tsx

export default function IntegrationLogsScreen() {
  const [logs, setLogs] = useState([]);
  const [filtros, setFiltros] = useState({
    tipo: 'all',
    status: 'all',
    dataInicio: '',
    dataFim: '',
  });
  
  return (
    <View>
      {/* Filtros */}
      <View style={styles.filters}>
        <Picker value={filtros.tipo} onChange={(v) => setFiltros({...filtros, tipo: v})}>
          <Picker.Item label="Todos" value="all" />
          <Picker.Item label="Importação" value="importacao" />
          <Picker.Item label="Consentimento" value="consentimento" />
          <Picker.Item label="Erro" value="erro" />
        </Picker>
        
        <Picker value={filtros.status} onChange={(v) => setFiltros({...filtros, status: v})}>
          <Picker.Item label="Todos" value="all" />
          <Picker.Item label="Sucesso" value="sucesso" />
          <Picker.Item label="Erro" value="erro" />
          <Picker.Item label="Processando" value="processando" />
        </Picker>
        
        <DateRangePicker
          value={{ inicio: filtros.dataInicio, fim: filtros.dataFim }}
          onChange={(range) => setFiltros({...filtros, ...range})}
        />
      </View>
      
      {/* Lista de logs */}
      <FlatList
        data={logs}
        renderItem={({ item }) => (
          <LogCard log={item} onRetry={() => retryImport(item.id)} />
        )}
      />
    </View>
  );
}

function LogCard({ log, onRetry }) {
  return (
    <GlassContainer style={styles.logCard}>
      <View style={styles.logHeader}>
        <Badge
          text={log.tipo}
          color={log.tipo === 'erro' ? '#EF4444' : '#10B981'}
        />
        <Badge
          text={log.status}
          color={log.status === 'sucesso' ? '#10B981' : '#EF4444'}
        />
      </View>
      
      <Text style={styles.logMessage}>{log.mensagem}</Text>
      <Text style={styles.logDate}>{formatDate(log.created_at)}</Text>
      
      {/* Detalhes expansíveis */}
      <Collapsible title="Ver Detalhes">
        <Text style={styles.logDetails}>
          {JSON.stringify(log.detalhes, null, 2)}
        </Text>
      </Collapsible>
      
      {/* Botão retry para erros */}
      {log.status === 'erro' && (
        <Button title="Tentar Novamente" onPress={onRetry} variant="secondary" />
      )}
    </GlassContainer>
  );
}
```

---

## 🎯 FASE 4: RELATÓRIOS E OPERAÇÕES (25-30h)

### **Semana 4 - Dias 1-4**

#### ✅ **Passo 4.1: Importação CSV** (15-20h)

[Implementação detalhada conforme documento principal]

#### ✅ **Passo 4.2: Tela de Relatórios** (8-10h)

[Implementação detalhada conforme documento principal]

#### ✅ **Passo 4.3: Relatório de Fluxo de Caixa** (9-12h)

[Implementação detalhada conforme documento principal]

---

## 🎯 FASE 5: REFINAMENTOS FINAIS (30-40h)

### **Semana 4 - Dia 5 + Semana 5**

#### ✅ **Passo 5.1: Notificações Toast** (4-5h)
#### ✅ **Passo 5.2: Botão de Ações Rápidas** (6-8h)
#### ✅ **Passo 5.3: Sistema de Categorias** (15-18h)
#### ✅ **Passo 5.4: Exportação CSV/PDF** (12-15h)
#### ✅ **Passo 5.5: Associação Usuários/Empresas** (10-12h)

---

## 📊 CRONOGRAMA RESUMIDO

| Semana | Fase | Horas | Entregas |
|--------|------|-------|----------|
| **Semana 1** | Fase 1 + Início Fase 2 | 40-48h | Correções críticas + BD Conciliação + Início tela |
| **Semana 2** | Fase 2 (continuação) | 40-48h | Conciliação completa + Dashboard diferenças |
| **Semana 3** | Fase 3 | 40-50h | Open Finance completo (consentimentos, importação, logs) |
| **Semana 4** | Fase 4 | 32-40h | Relatórios + CSV + Início refinamentos |
| **Semana 5** | Fase 5 | 30-40h | Refinamentos finais + Testes |

**TOTAL**: 182-226 horas (~5-6 semanas)

---

## ✅ CHECKLIST DE TESTES

### Após cada fase, testar:

#### Fase 1:
- [ ] CNPJ duplicado permitido entre empresas diferentes
- [ ] CNPJ duplicado bloqueado dentro da mesma empresa
- [ ] Seletor de contexto funciona
- [ ] Contexto persiste ao recarregar
- [ ] Dados filtram por empresa selecionada

#### Fase 2:
- [ ] Carregar transações e títulos pendentes
- [ ] Selecionar item de cada lado
- [ ] Visualizar sugestões de match
- [ ] Conciliar com sucesso
- [ ] Conciliar com diferença
- [ ] Desfazer conciliação
- [ ] Visualizar histórico
- [ ] Exportar diferenças

#### Fase 3:
- [ ] Listar bancos disponíveis
- [ ] Criar consentimento
- [ ] Renovar consentimento
- [ ] Revogar consentimento
- [ ] Importar transações
- [ ] Deduplicar transações
- [ ] Visualizar logs
- [ ] Retry de importação falhada

#### Fase 4:
- [ ] Upload CSV
- [ ] Validar CSV
- [ ] Importar lançamentos
- [ ] Gerar relatório de conciliação
- [ ] Gerar relatório de fluxo de caixa
- [ ] Exportar relatórios

#### Fase 5:
- [ ] Toasts aparecem corretamente
- [ ] FAB abre menu de ações
- [ ] Criar categoria N2
- [ ] Editar categoria criada
- [ ] Não editar N1
- [ ] Exportar CSV
- [ ] Exportar PDF
- [ ] Associar usuário a empresa
- [ ] Verificar acesso por empresa

---

**Documento gerado em**: 15/01/2026
**Versão**: 1.0
**Próxima revisão**: Após Sprint 2
