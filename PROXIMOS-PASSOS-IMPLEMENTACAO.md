# 🚀 Próximos Passos de Implementação – Horas por Demanda

## 📊 Status Atual por Sprint

| Sprint | Status | Concluído | Pendente |
|--------|--------|-----------|----------|
| **Sprint 1** | ~95% | Auth, perfis, empresas, Open Finance UI, **API real transações e saldo**, tratamento duplicatas | Renovação tokens, vinculação conta |
| **Sprint 2** | ~95% | Tela conciliação, matching, desfazer, histórico | Polimento e ajustes |
| **Sprint 3** | ~85% | Títulos, CSV, relatórios, dashboard | Integrar relatórios com dados reais |
| **Sprint 4** | ~70% | Permissões, export CSV | Associação usuário×empresa, export PDF |

---

## 📋 SPRINT 1 – Acesso e Conexão Bancária

### ✅ Já implementado
- Módulo de autenticação e perfis (Admin / Analista / Viewer)
- Cadastro de empresas (CNPJ/Grupo)
- Criar/renovar/revogar consentimento (UI)
- Logs de integração
- Integração Pluggy (Connect Widget)
- ✅ **Integração real de transações** – busca transações via API Pluggy (últimos 90 dias)
- ✅ **Integração real de saldo** – busca saldo via API Pluggy
- ✅ **Tratamento de duplicatas** – verifica por `bank_transaction_id` e por valor+data+descrição

### ⏱️ Pendências e Horas

| # | Tarefa | Horas | Prioridade | Status |
|---|--------|-------|------------|--------|
| 1.1 | ~~**Integração real de transações** – trocar mock por API Pluggy em `handleImportTransactions`~~ | ~~**3h**~~ | ✅ Concluído | ✅ |
| 1.2 | ~~**Integração real de saldo** – trocar mock por API Pluggy em `handleImportBalance`~~ | ~~**2h**~~ | ✅ Concluído | ✅ |
| 1.3 | **Renovação automática de tokens** – verificar expiração e renovar via Pluggy | **3h** | 🟡 Média | ⏳ |
| 1.4 | ~~**Tratamento de duplicatas** na importação de transações~~ | ~~**2h**~~ | ✅ Concluído | ✅ |
| 1.5 | **Vinculação conta bancária** – associar conta do Open Finance à conta manual no cadastro | **2h** | 🟢 Baixa | ⏳ |

**Total Sprint 1 restante:** **5h** (1.3 + 1.5)

---

## 📋 SPRINT 2 – Conciliação Básica

### ✅ Já implementado
- Tela de conciliação (duas colunas: banco × ERP)
- Matching 1-1 com regra de valor e data
- Estados: conciliado, conciliado com diferença
- Desfazer conciliação com histórico
- Visualização de sugestões (sobras/faltas implícitas no matching)

### ⏱️ Pendências e Horas

| # | Tarefa | Horas | Prioridade |
|---|--------|-------|------------|
| 2.1 | **Seção explícita de sobras/faltas** – lista dedicada de transações sem título e títulos sem transação | **2h** | 🔴 Alta |
| 2.2 | **Filtro por período** na tela de conciliação | **1,5h** | 🟡 Média |
| 2.3 | **Badge "pendente"** – exibir estado pendente (não conciliado) nos itens | **1h** | 🟡 Média |
| 2.4 | **Ajustes de UX** – rolagem independente mais estável, atalhos | **1,5h** | 🟢 Baixa |

**Total Sprint 2:** **6h**

---

## 📋 SPRINT 3 – Operações e Relatórios Iniciais

### ✅ Já implementado
- CRUD de títulos a pagar/receber
- Importação em lote via CSV
- Estrutura de relatórios (reports.ts)
- Relatório de fluxo de caixa básico
- Painel inicial com cards
- Modal de relatórios e exportação

### ⏱️ Pendências e Horas

| # | Tarefa | Horas | Prioridade |
|---|--------|-------|------------|
| 3.1 | **Relatório extrato conciliado x não conciliado** – integrar com dados reais da tabela `conciliacoes` | **3h** | 🔴 Alta |
| 3.2 | **Fluxo de caixa realizado** – refinamento e validação com dados reais | **2h** | 🟡 Média |
| 3.3 | **Cards de conciliação no dashboard** – taxa por empresa, pendências | **2h** | 🟡 Média |
| 3.4 | **Filtros por período** nos relatórios | **1h** | 🟢 Baixa |

**Total Sprint 3:** **8h**

---

## 📋 SPRINT 4 – Multiusuários e Refinamentos

### ✅ Já implementado
- Permissões (Admin, Analista, Viewer)
- Associação empresas via CompanyContext
- Notificações toast
- Exportação CSV (reconciliation-export)
- Rolagem independente e animações

### ⏱️ Pendências e Horas

| # | Tarefa | Horas | Prioridade |
|---|--------|-------|------------|
| 4.1 | **Interface de associação usuário × empresas** – modal na tela de usuários, seleção múltipla | **4h** | 🔴 Alta |
| 4.2 | **Tabela e lógica de associação** – criar `user_empresas` (se inexistente), CRUD | **2h** | 🔴 Alta |
| 4.3 | **Filtrar dados por empresa** – usuário vê apenas empresas associadas | **2h** | 🟡 Média |
| 4.4 | **Exportação em PDF** – relatórios em PDF | **4h** | 🟡 Média |
| 4.5 | **Melhorias de usabilidade** – atalhos, feedback visual | **2h** | 🟢 Baixa |

**Total Sprint 4:** **14h**

---

## 📊 Resumo Geral de Horas

| Sprint | Horas Original | Horas Restantes | Concluído |
|--------|----------------|-----------------|-----------|
| **Sprint 1** | 12h | **5h** | ✅ 7h (transações + saldo + duplicatas) |
| **Sprint 2** | 6h | 6h | ⏳ |
| **Sprint 3** | 8h | 8h | ⏳ |
| **Sprint 4** | 14h | 14h | ⏳ |
| **TOTAL** | **40h** | **33h** | **7h concluídas** |

---

## 🎯 Ordem Recomendada de Implementação

### Fase 1 – Crítico (10h restantes)
1. ~~**1.1** Integração real transações – **3h**~~ ✅ Concluído
2. ~~**1.2** Integração real saldo – **2h**~~ ✅ Concluído
3. **2.1** Seção sobras/faltas – **2h** (já existe seção, mas pode precisar refinamento)
4. **4.1** Interface associação usuário×empresas – **4h**
5. **4.2** Tabela e lógica de associação – **2h**
6. **3.1** Relatório conciliado x não conciliado – **3h** (já existe, precisa integrar melhor)
7. **4.3** Filtrar dados por empresa – **1h** (parcialmente feito, precisa user_empresas)

### Fase 2 – Importante (10,5h restantes)
8. **1.3** Renovação automática tokens – **3h**
9. **3.2** Fluxo de caixa refinado – **2h**
10. **3.3** Cards conciliação no dashboard – **2h**
11. **4.4** Exportação PDF – **4h**
12. **2.2** Filtro por período na conciliação – **1,5h**
13. ~~**1.4** Tratamento duplicatas – **2h**~~ ✅ Concluído

### Fase 3 – Refinamentos (10h)
14. **2.3** Badge pendente – **1h**
15. **2.4** Ajustes UX conciliação – **1,5h**
16. **3.4** Filtros período nos relatórios – **1h**
17. **4.5** Melhorias usabilidade – **2h**
18. **1.5** Vinculação conta bancária – **2h**
19. Buffer para testes e ajustes – **2,5h**

---

## ✅ Checklist Rápido

- [x] **Sprint 1 (parcial):** ✅ Transações e saldo reais via Pluggy + tratamento duplicatas (7h concluídas)
- [ ] **Sprint 1 (restante):** Renovação tokens + vinculação conta (5h restantes)
- [ ] **Sprint 2:** Filtros por período e ajustes UX (6h)
- [ ] **Sprint 3:** Relatórios integrados e cards por empresa (8h)
- [ ] **Sprint 4:** Associação usuário×empresa e PDF (14h)

---

**Última atualização:** 06/02/2026  
**Baseado em:** estado atual do código e demandas do projeto  
**Sprint 1 (1.1 + 1.2 + 1.4):** ✅ **CONCLUÍDO** – Integração real Pluggy implementada com sucesso!
