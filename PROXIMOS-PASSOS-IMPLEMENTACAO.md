# 🎯 Próximos Passos na Implementação - Borderless

## 📊 Status Atual do Projeto

### ✅ **Já Implementado:**
- ✅ CRUD completo de Transações, Empresas, Títulos, Contas Bancárias
- ✅ Sistema de autenticação e perfis (Admin, Analista, Viewer)
- ✅ Busca, filtros e ordenação em todas as telas
- ✅ Validações (CNPJ, Email, CEP)
- ✅ Formatação automática de valores
- ✅ Layout responsivo com glassmorphism
- ✅ Animações e transições suaves
- ✅ Integração completa com Supabase
- ✅ RLS (Row Level Security) configurado

### ❌ **Faltando Implementar:**

---

## 🚀 PRÓXIMOS PASSOS (Por Prioridade)

### 🔴 **FASE 1: CORREÇÕES CRÍTICAS** (10-12h)

#### **1.1 Correção: Duplicidade de CNPJ por Empresa** ⏱️ **3-4h**
**Status**: Documentado, não implementado

**O que fazer:**
- Permitir mesmo CNPJ em empresas diferentes (contextos diferentes)
- Ajustar constraint no banco de dados
- Atualizar validações no código
- Testar cenários

**Arquivos a modificar:**
- `scripts/supabase-setup.sql` - Ajustar constraints
- `lib/services/companies.ts` - Atualizar validação
- `app/(tabs)/companies.tsx` - Ajustar lógica

**Criticidade**: 🔴 **ALTA** - Afeta lógica de negócio fundamental

---

#### **1.2 Seletor de Contexto Empresarial** ⏱️ **6-8h**
**Status**: Não implementado

**O que fazer:**
- Criar `contexts/CompanyContext.tsx`
- Criar componente `components/CompanySelector.tsx`
- Adicionar no header de todas as telas
- Persistir seleção (AsyncStorage)
- Filtrar dados automaticamente por empresa selecionada

**Arquivos a criar:**
- `contexts/CompanyContext.tsx`
- `components/CompanySelector.tsx`

**Arquivos a modificar:**
- `app/_layout.tsx` - Adicionar CompanyProvider
- Todas as telas - Filtrar por empresa selecionada

**Criticidade**: 🟡 **MÉDIA** - Melhora UX significativamente

---

### 🔴 **FASE 2: SISTEMA DE CONCILIAÇÃO BANCÁRIA** (50-63h)

#### **2.1 Banco de Dados - Conciliação** ⏱️ **4-5h**
**Status**: Não implementado

**O que fazer:**
- Criar tabela `conciliacoes`
- Criar tabela `historico_conciliacoes`
- Criar índices para performance
- Configurar RLS (Row Level Security)
- Testar estrutura

**Arquivos a criar:**
- `scripts/reconciliation-setup.sql`

**Criticidade**: 🔴 **ALTA** - Funcionalidade core do sistema

---

#### **2.2 Serviço de Conciliação (Backend)** ⏱️ **6-8h**
**Status**: Não implementado

**O que fazer:**
- Criar `lib/services/reconciliation.ts`
- Função `buscarItensPendentes()`
- Função `sugerirMatches()` - Matching automático inteligente
- Função `conciliar()` - Criar conciliação
- Função `desfazerConciliacao()` - Desfazer com histórico

**Arquivos a criar:**
- `lib/services/reconciliation.ts`

**Criticidade**: 🔴 **ALTA** - Lógica de negócio essencial

---

#### **2.3 Tela de Conciliação - Layout** ⏱️ **8-10h**
**Status**: Não implementado

**O que fazer:**
- Criar `app/(tabs)/reconciliation.tsx`
- Layout com duas colunas lado a lado
- Coluna esquerda: Transações Bancárias
- Coluna direita: Títulos ERP
- Cards para cada item
- Seleção visual (highlight)
- Botão "Conciliar" aparece quando ambos selecionados

**Arquivos a criar:**
- `app/(tabs)/reconciliation.tsx`
- `components/reconciliation-card.tsx` (opcional)

**Criticidade**: 🔴 **ALTA** - Interface principal da funcionalidade

---

#### **2.4 Tela de Conciliação - Lógica** ⏱️ **8-10h**
**Status**: Não implementado

**O que fazer:**
- Implementar seleção de itens
- Mostrar sugestões de matches automáticos
- Modal de confirmação com diferenças
- Campo de observações
- Integrar com serviço de conciliação
- Feedback visual (toast/alert)

**Arquivos a modificar:**
- `app/(tabs)/reconciliation.tsx`

**Criticidade**: 🔴 **ALTA** - Funcionalidade core

---

#### **2.5 Tab de Conciliação - Conciliação** ⏱️ **6-8h**
**Status**: Não implementado

**O que fazer:**
- Tab para mostrar itens já conciliados
- Lista de conciliações realizadas
- Botão "Desfazer" em cada item
- Visualização de histórico
- Filtros por período

**Arquivos a modificar:**
- `app/(tabs)/reconciliation.tsx`

**Criticidade**: 🔴 **ALTA** - Necessário para gestão

---

#### **2.6 Dashboard de Diferenças** ⏱️ **6-7h**
**Status**: Não implementado

**O que fazer:**
- Tab "Diferenças" na tela de conciliação
- Mostrar "Sobras" (transações sem match)
- Mostrar "Faltas" (títulos sem match)
- Cards de resumo (total conciliado, pendente, taxa)
- Botão exportar CSV de diferenças

**Arquivos a modificar:**
- `app/(tabs)/reconciliation.tsx`
- `lib/utils/csv-export.ts` (criar)

**Criticidade**: 🟡 **MÉDIA** - Importante para análise

---

#### **2.7 Testes e Ajustes de Conciliação** ⏱️ **8h**
**Status**: Não implementado

**O que fazer:**
- Testar fluxo completo
- Corrigir bugs encontrados
- Refinamentos de UX
- Otimizações de performance
- Validações adicionais

**Criticidade**: 🔴 **ALTA** - Garantir qualidade

---

### 🔴 **FASE 3: INTEGRAÇÃO OPEN FINANCE** (40-50h)

#### **3.1 Setup e Configuração Pluggy** ⏱️ **6-8h**
**Status**: Documentado, não implementado

**O que fazer:**
- Criar conta no Pluggy (ou Plugg.to)
- Obter credenciais (Client ID e Secret)
- Configurar variáveis de ambiente
- Criar serviço base `lib/services/open-finance.ts`
- Criar tabelas no banco (conexões, consentimentos, logs)
- Testar autenticação com API

**Arquivos a criar:**
- `lib/services/open-finance.ts`
- `scripts/open-finance-setup.sql`

**Arquivos a modificar:**
- `.env` - Adicionar credenciais

**Criticidade**: 🔴 **ALTA** - Base para importação automática

**Dependências**: Credenciais do Pluggy/Plugg.to

---

#### **3.2 Gestão de Consentimentos** ⏱️ **12-15h**
**Status**: Não implementado

**O que fazer:**
- Criar tela `app/(tabs)/bank-connections.tsx`
- Listar bancos disponíveis
- Modal de seleção de banco
- Integrar widget Pluggy para autenticação
- Criar consentimento
- Salvar conexão no banco
- Renovar consentimento
- Revogar consentimento
- Status de conexão (ativa, expirada, erro)

**Arquivos a criar:**
- `app/(tabs)/bank-connections.tsx`
- `components/bank-connection-card.tsx` (já existe, ajustar)

**Criticidade**: 🔴 **ALTA** - Necessário para conectar bancos

---

#### **3.3 Importação de Transações** ⏱️ **15-20h**
**Status**: Não implementado

**O que fazer:**
- Botão "Importar" na tela de contas
- Modal de importação com seletor de período
- Chamar API Pluggy para buscar transações
- Parsing e normalização de dados
- Deduplicação automática (verificar `pluggy_transaction_id`)
- Inserção em lote no Supabase
- Barra de progresso
- Importar saldos das contas
- Atualizar `ultima_sincronizacao`

**Arquivos a criar/modificar:**
- `app/(tabs)/accounts.tsx` - Adicionar botão importar
- `components/import-transactions-modal.tsx`
- `lib/services/open-finance.ts` - Funções de importação

**Criticidade**: 🔴 **ALTA** - Funcionalidade principal

---

#### **3.4 Tela de Logs de Integração** ⏱️ **7-10h**
**Status**: Não implementado

**O que fazer:**
- Criar `app/(tabs)/integration-logs.tsx`
- Listar logs de importação
- Filtros por tipo (importação, consentimento, erro)
- Filtros por status (sucesso, erro, processando)
- Filtros por data
- Detalhes expansíveis
- Botão "Tentar Novamente" para erros
- Badges coloridos por status

**Arquivos a criar:**
- `app/(tabs)/integration-logs.tsx`

**Criticidade**: 🟡 **MÉDIA** - Importante para debug e monitoramento

---

### 🟡 **FASE 4: RELATÓRIOS E OPERAÇÕES** (25-30h)

#### **4.1 Importação CSV de Lançamentos** ⏱️ **15-20h**
**Status**: Não implementado

**O que fazer:**
- Criar modal de upload CSV
- Parser de arquivo CSV
- Validação de dados (campos obrigatórios, formatos)
- Preview antes de importar
- Mapeamento de colunas
- Inserção em lote
- Relatório de erros (quais linhas falharam e por quê)
- Template CSV para download
- Tratamento de encoding (UTF-8)

**Arquivos a criar:**
- `components/csv-import-modal.tsx`
- `lib/utils/csv-parser.ts`
- `lib/utils/csv-validator.ts`

**Arquivos a modificar:**
- `app/(tabs)/transactions.tsx` - Adicionar botão importar

**Criticidade**: 🟡 **MÉDIA** - Facilita importação em lote

---

#### **4.2 Tela de Relatórios** ⏱️ **8-10h**
**Status**: Não implementado

**O que fazer:**
- Criar `app/(tabs)/reports.tsx`
- Seletor de tipo de relatório
- Filtros globais (período, conta, empresa)
- Cards de resumo
- Layout responsivo

**Arquivos a criar:**
- `app/(tabs)/reports.tsx`
- `components/report-card.tsx`

**Criticidade**: 🟡 **MÉDIA** - Importante para análise

---

#### **4.3 Relatório: Conciliação** ⏱️ **8h**
**Status**: Não implementado

**O que fazer:**
- Card: Total Conciliado vs Não Conciliado
- Gráfico de barras ou pizza
- Tabela detalhada de conciliações
- Filtros por período e conta
- Botão exportar CSV

**Arquivos a criar/modificar:**
- `app/(tabs)/reports.tsx` - Adicionar seção conciliação
- `lib/services/reports.ts` - Função gerarRelatorioConciliacao()

**Criticidade**: 🟡 **MÉDIA** - Importante para gestão

---

#### **4.4 Relatório: Fluxo de Caixa Realizado** ⏱️ **9-12h**
**Status**: Não implementado

**O que fazer:**
- Card: Entradas vs Saídas
- Gráfico temporal (linha ou área)
- Tabela por período (diário/semanal/mensal)
- Filtros por período e conta
- Botão exportar CSV

**Arquivos a criar/modificar:**
- `app/(tabs)/reports.tsx` - Adicionar seção fluxo de caixa
- `lib/services/reports.ts` - Função gerarRelatorioFluxoCaixa()

**Criticidade**: 🟡 **MÉDIA** - Importante para análise financeira

---

### 🟢 **FASE 5: REFINAMENTOS E MELHORIAS** (4-5h)

#### **5.1 Sistema de Notificações Toast** ⏱️ **4-5h**
**Status**: Não implementado

**O que fazer:**
- Instalar biblioteca (ex: `react-native-toast-message` ou `expo-notifications`)
- Criar componente Toast customizado
- Substituir todos os `Alert.alert()` por toasts
- Tipos: sucesso, erro, aviso, info
- Posicionamento e animações

**Arquivos a criar:**
- `components/toast.tsx` ou usar biblioteca

**Arquivos a modificar:**
- Todas as telas - Substituir Alerts

**Criticidade**: 🟢 **BAIXA** - Melhora UX, mas não crítico

---

## 📊 RESUMO POR PRIORIDADE

### 🔴 **CRÍTICO** (93-117h)
| Tarefa | Horas | Status |
|--------|-------|--------|
| Correção CNPJ | 3-4h | ⏳ Pendente |
| Seletor Contexto | 6-8h | ⏳ Pendente |
| BD Conciliação | 4-5h | ⏳ Pendente |
| Serviço Conciliação | 6-8h | ⏳ Pendente |
| Tela Conciliação Layout | 8-10h | ⏳ Pendente |
| Tela Conciliação Lógica | 8-10h | ⏳ Pendente |
| Tab Conciliação | 6-8h | ⏳ Pendente |
| Dashboard Diferenças | 6-7h | ⏳ Pendente |
| Testes Conciliação | 8h | ⏳ Pendente |
| Setup Open Finance | 6-8h | ⏳ Pendente |
| Gestão Consentimentos | 12-15h | ⏳ Pendente |
| Importação Transações | 15-20h | ⏳ Pendente |
| **TOTAL CRÍTICO** | **93-117h** | |

### 🟡 **IMPORTANTE** (46-58h)
| Tarefa | Horas | Status |
|--------|-------|--------|
| Logs Integração | 7-10h | ⏳ Pendente |
| Importação CSV | 15-20h | ⏳ Pendente |
| Tela Relatórios | 8-10h | ⏳ Pendente |
| Relatório Conciliação | 8h | ⏳ Pendente |
| Relatório Fluxo Caixa | 9-12h | ⏳ Pendente |
| **TOTAL IMPORTANTE** | **46-58h** | |

### 🟢 **REFINAMENTO** (4-5h)
| Tarefa | Horas | Status |
|--------|-------|--------|
| Notificações Toast | 4-5h | ⏳ Pendente |
| **TOTAL REFINAMENTO** | **4-5h** | |

---

## 📅 CRONOGRAMA SUGERIDO

### **Semana 1** (40-48h)
- ✅ Correção CNPJ (3-4h)
- ✅ Seletor Contexto (6-8h)
- ✅ BD Conciliação (4-5h)
- ✅ Serviço Conciliação (6-8h)
- ✅ Tela Conciliação - Layout (8-10h)
- ✅ Tela Conciliação - Lógica (8-10h)

**Entrega**: Base de Conciliação funcional

---

### **Semana 2** (38-45h)
- ✅ Tab Conciliação (6-8h)
- ✅ Dashboard Diferenças (6-7h)
- ✅ Testes Conciliação (8h)
- ✅ Setup Open Finance (6-8h)
- ✅ Gestão Consentimentos - Parte 1 (6-8h)

**Entrega**: Conciliação completa + Início Open Finance

---

### **Semana 3** (40-50h)
- ✅ Gestão Consentimentos - Parte 2 (6-7h)
- ✅ Importação Transações (15-20h)
- ✅ Logs Integração (7-10h)
- ✅ Testes Open Finance (8h)

**Entrega**: Open Finance completo

---

### **Semana 4** (40-48h)
- ✅ Importação CSV (15-20h)
- ✅ Tela Relatórios (8-10h)
- ✅ Relatório Conciliação (8h)
- ✅ Relatório Fluxo Caixa (9-12h)

**Entrega**: Relatórios + Importação CSV

---

### **Semana 5** (4-5h + Buffer)
- ✅ Notificações Toast (4-5h)
- ✅ Testes finais
- ✅ Ajustes e correções
- ✅ Documentação

**Entrega**: MVP Completo

---

## 🎯 TOTAL ESTIMADO

| Prioridade | Horas Mínimas | Horas Máximas | Média |
|------------|---------------|---------------|-------|
| 🔴 Crítico | 93h | 117h | **105h** |
| 🟡 Importante | 46h | 58h | **52h** |
| 🟢 Refinamento | 4h | 5h | **5h** |
| **TOTAL** | **143h** | **180h** | **~162h** |

**Estimativa**: **20-22 dias úteis** (assumindo 8h/dia)

---

## ⚠️ DEPENDÊNCIAS E RISCOS

### **Dependências Externas:**
1. **Credenciais Pluggy/Plugg.to** ⚠️
   - Pode levar 1-2 dias para aprovação
   - **Mitigação**: Começar outras tarefas primeiro

2. **Biblioteca de Gráficos** 📊
   - Escolher: `react-native-chart-kit` ou `victory-native`
   - **Estimativa**: Incluída nas horas de relatórios

### **Riscos:**
- **Alta complexidade na Conciliação**: Pode levar mais tempo
- **Integração Pluggy pode falhar**: Ter plano B (importação manual)
- **Performance com muitos dados**: Implementar paginação se necessário

---

## ✅ CHECKLIST DE PRÓXIMAS AÇÕES

### **Hoje/Esta Semana:**
- [ ] **Correção CNPJ** (3-4h) - Começar por aqui
- [ ] **Seletor Contexto** (6-8h) - Melhora UX significativamente
- [ ] **BD Conciliação** (4-5h) - Base para funcionalidade principal

### **Próxima Semana:**
- [ ] **Serviço Conciliação** (6-8h)
- [ ] **Tela Conciliação** (16-20h)
- [ ] **Dashboard Diferenças** (6-7h)

### **Em Paralelo (quando tiver credenciais):**
- [ ] **Setup Open Finance** (6-8h)
- [ ] **Gestão Consentimentos** (12-15h)

---

## 📝 OBSERVAÇÕES IMPORTANTES

1. **Ordem de Implementação**: Seguir a ordem sugerida (Fase 1 → 2 → 3 → 4 → 5)
2. **Testes**: Testar cada funcionalidade antes de passar para a próxima
3. **Documentação**: Atualizar documentação conforme implementa
4. **Commits**: Fazer commits frequentes e descritivos
5. **Buffer**: Semana 5 tem buffer para ajustes finais

---

**Última atualização**: Janeiro 2025  
**Próxima revisão**: Após completar Fase 1
