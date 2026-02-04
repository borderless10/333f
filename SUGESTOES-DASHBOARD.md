# Sugestões de Melhorias para a Dashboard Principal

Este documento lista funcionalidades e melhorias que podem ser implementadas na dashboard principal (`app/(tabs)/index.tsx`) para torná-la mais completa e útil.

---

## 📊 **1. Filtros por Período**

### O que adicionar:
- **Seletor de período** no topo (Hoje, Semana, Mês, Ano, Personalizado)
- Cards de Saldo/Receitas/Despesas atualizados conforme o período selecionado
- Comparação com período anterior (ex.: "vs mês passado")

### Benefícios:
- Visualização de dados por período específico
- Análise de tendências temporais
- Melhor tomada de decisão

### Implementação sugerida:
```tsx
// Estado para período selecionado
const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');

// Filtrar transações por período
const filteredTransactions = useMemo(() => {
  const now = new Date();
  const startDate = getPeriodStartDate(selectedPeriod, now);
  return transactions.filter(t => new Date(t.data) >= startDate);
}, [transactions, selectedPeriod]);
```

---

## 📈 **2. Gráficos Visuais**

### O que adicionar:
- **Gráfico de linha** ou **área**: Receitas vs Despesas ao longo do tempo
- **Gráfico de pizza**: Distribuição de despesas por categoria
- **Gráfico de barras**: Comparação mensal (últimos 6 meses)
- **Mini gráfico sparkline**: Tendência do saldo nos últimos 30 dias

### Bibliotecas sugeridas:
- `react-native-chart-kit` ou `victory-native` (gráficos)
- `react-native-svg` (já instalado)

### Benefícios:
- Visualização intuitiva dos dados
- Identificação rápida de padrões
- Dashboard mais profissional

---

## 🎯 **3. Indicadores de Performance**

### O que adicionar:
- **Margem de lucro**: `(Receitas - Despesas) / Receitas * 100`
- **Taxa de crescimento**: Comparação com período anterior
- **Fluxo de caixa projetado**: Baseado em média dos últimos meses
- **Dias de caixa**: Quantos dias o saldo atual cobre as despesas médias

### Exemplo de card:
```
┌─────────────────────────┐
│ 📊 Indicadores          │
├─────────────────────────┤
│ Margem: 35% (+2.5%)     │
│ Crescimento: +12.3%      │
│ Fluxo projetado: R$ 50k │
└─────────────────────────┘
```

---

## ⚠️ **4. Alertas e Notificações**

### O que adicionar:
- **Card de alertas** com:
  - Contas a vencer nos próximos 7 dias (títulos)
  - Saldo baixo (abaixo de um threshold configurável)
  - Transações não conciliadas há mais de 30 dias
  - Conexões bancárias expiradas ou com erro

### Benefícios:
- Ações preventivas
- Não perder prazos importantes
- Manter saúde financeira

---

## 🏆 **5. Metas e Objetivos Financeiros**

### O que adicionar:
- **Card de metas**:
  - Meta de receita mensal (progresso em %)
  - Meta de economia (quanto falta para atingir)
  - Meta de redução de despesas

### Exemplo:
```
┌─────────────────────────┐
│ 🎯 Metas do Mês         │
├─────────────────────────┤
│ Receita: 75% ████████░░ │
│ Economia: 60% ██████░░░░│
│ Redução: 80% ████████░░ │
└─────────────────────────┘
```

---

## 📋 **6. Resumo por Categoria**

### O que adicionar:
- **Top 5 categorias de despesas** (com valores e %)
- **Top 5 categorias de receitas**
- **Gráfico de pizza** ou **lista** mostrando distribuição

### Benefícios:
- Identificar onde o dinheiro está sendo gasto
- Planejamento de orçamento por categoria
- Detecção de gastos excessivos

---

## 📅 **7. Comparação com Período Anterior**

### O que adicionar:
- **Indicadores de comparação** nos cards:
  - "Receitas: R$ 50.000 (+12% vs mês passado)"
  - "Despesas: R$ 30.000 (-5% vs mês passado)"
  - Setas e cores indicando aumento/diminuição

### Benefícios:
- Análise de tendências
- Identificação de melhorias ou problemas
- Contexto temporal dos números

---

## 💳 **8. Status de Conexões Bancárias**

### O que adicionar:
- **Card resumo** mostrando:
  - Número de conexões ativas
  - Última sincronização
  - Conexões com problemas (expiradas, erro)
  - Link rápido para gerenciar conexões

### Exemplo:
```
┌─────────────────────────┐
│ 🔗 Conexões Bancárias   │
├─────────────────────────┤
│ ✅ 3 ativas             │
│ ⚠️ 1 expirada           │
│ Última sync: há 2h      │
│ [Gerenciar]             │
└─────────────────────────┘
```

---

## 📊 **9. Resumo de Títulos (Contas a Pagar/Receber)**

### O que adicionar:
- **Card resumo** com:
  - Total a receber (próximos 30 dias)
  - Total a pagar (próximos 30 dias)
  - Títulos vencidos
  - Link para tela de Títulos

### Benefícios:
- Visão rápida do fluxo de caixa futuro
- Alertas de vencimentos
- Planejamento financeiro

---

## 🔄 **10. Atualização Automática**

### O que adicionar:
- **Auto-refresh** a cada X minutos (configurável)
- **Indicador de última atualização** ("Atualizado há 5 min")
- **Sincronização em background** quando app volta ao foco

---

## 📱 **11. Widgets Personalizáveis**

### O que adicionar:
- **Arrastar e soltar** para reordenar cards
- **Mostrar/ocultar** cards específicos
- **Tamanhos customizáveis** (compacto, normal, expandido)

### Benefícios:
- Dashboard personalizada para cada usuário
- Foco no que é mais importante
- Melhor experiência do usuário

---

## 🎨 **12. Tema Claro/Escuro Dinâmico**

### O que adicionar:
- **Toggle** para alternar entre tema claro e escuro
- **Persistência** da preferência do usuário
- **Transição suave** entre temas

---

## 📈 **13. Previsões e Projeções**

### O que adicionar:
- **Projeção de saldo** para os próximos 30 dias
- **Previsão de receitas** baseada em histórico
- **Alerta de saldo negativo** projetado

### Benefícios:
- Planejamento antecipado
- Evitar problemas de fluxo de caixa
- Decisões mais informadas

---

## 🔍 **14. Busca Rápida**

### O que adicionar:
- **Barra de busca** no topo da dashboard
- Buscar por:
  - Descrição de transação
  - Categoria
  - Valor
  - Data
- **Resultados em tempo real**

---

## 📊 **15. Resumo de Empresas (se multi-empresa)**

### O que adicionar:
- **Comparação entre empresas** (se usuário tem acesso a múltiplas)
- **Switch rápido** entre empresas
- **Métricas agregadas** de todas as empresas

---

## 🎯 **16. Insights e Dicas**

### O que adicionar:
- **Card de insights** com:
  - "Você gastou 20% mais em [categoria] este mês"
  - "Sua receita aumentou 15% comparado ao mês passado"
  - "Recomendação: Reduzir gastos em [categoria]"
- **Dicas financeiras** rotativas

---

## 📱 **17. Ações Rápidas Expandidas**

### O que adicionar (além das atuais):
- **Conectar Conta Bancária** (Pluggy)
- **Ver Títulos** (contas a pagar/receber)
- **Conciliação Rápida** (1 clique)
- **Exportar Dados** (CSV, PDF)

---

## 🔔 **18. Notificações Push (Futuro)**

### O que adicionar:
- **Notificações** para:
  - Títulos vencendo hoje
  - Saldo baixo
  - Nova transação importada
  - Conciliação pendente

---

## 📊 **19. Dashboard Comparativa**

### O que adicionar:
- **Comparação lado a lado**:
  - Este mês vs Mês passado
  - Este ano vs Ano passado
  - Empresa A vs Empresa B

---

## 🎨 **20. Melhorias Visuais**

### O que adicionar:
- **Skeleton loaders** durante carregamento (em vez de spinner)
- **Animações mais suaves** entre estados
- **Micro-interações** ao tocar em cards
- **Gradientes** nos cards principais
- **Ícones animados** (Lottie)

---

## 🚀 **Priorização Sugerida**

### **Alta Prioridade** (Impacto alto, Esforço médio):
1. ✅ **Filtros por período** (Hoje, Semana, Mês, Ano)
2. ✅ **Comparação com período anterior** (setas e %)
3. ✅ **Alertas** (títulos vencendo, saldo baixo)
4. ✅ **Resumo por categoria** (Top 5 despesas/receitas)

### **Média Prioridade** (Impacto alto, Esforço alto):
5. ✅ **Gráficos visuais** (linha, pizza, barras)
6. ✅ **Indicadores de performance** (margem, crescimento)
7. ✅ **Status de conexões bancárias** (widget resumo)
8. ✅ **Resumo de títulos** (a pagar/receber)

### **Baixa Prioridade** (Impacto médio, Esforço variável):
9. ✅ **Metas financeiras** (progresso)
10. ✅ **Previsões/projeções** (próximos 30 dias)
11. ✅ **Widgets personalizáveis** (drag & drop)
12. ✅ **Busca rápida**

---

## 💡 **Implementação Rápida (Quick Wins)**

### 1. **Comparação com período anterior** (30 min)
- Adicionar cálculo de % de mudança
- Mostrar setas e cores nos cards existentes

### 2. **Filtro de período simples** (1h)
- Dropdown com "Hoje", "Semana", "Mês", "Ano"
- Filtrar transações e recalcular totais

### 3. **Top 3 categorias** (45 min)
- Agrupar transações por categoria
- Mostrar lista simples abaixo dos cards

### 4. **Status de conexões** (30 min)
- Card pequeno mostrando número de conexões ativas
- Link para tela de conexões

### 5. **Última atualização** (15 min)
- Timestamp "Atualizado há X minutos"
- Botão manual de refresh

---

## 📝 **Exemplo de Estrutura Sugerida**

```
Dashboard
├── Header (com filtro de período)
├── Cards Financeiros
│   ├── Saldo Total (com comparação)
│   ├── Receitas (com comparação)
│   └── Despesas (com comparação)
├── Gráfico de Tendência (linha)
├── Resumo por Categoria
│   ├── Top 5 Despesas
│   └── Top 5 Receitas
├── Alertas e Notificações
├── Status Conexões Bancárias
├── Resumo Títulos (a pagar/receber)
├── Transações Recentes
├── Conciliação Bancária
└── Ações Rápidas
```

---

**Qual dessas funcionalidades você gostaria de implementar primeiro?** Posso começar pelas de alta prioridade ou pelas que você considerar mais importantes para o seu caso de uso.
