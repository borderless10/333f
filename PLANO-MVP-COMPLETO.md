# 🎯 PLANO DE EXECUÇÃO - MVP COMPLETO (OPÇÃO 2)

## ✅ DECISÃO APROVADA

**Opção Escolhida**: MVP Completo  
**Prazo**: 4-5 semanas (17-22 dias úteis)  
**Estimativa**: 140-175 horas  
**Data de Início**: 15/01/2026  
**Data Prevista de Entrega**: 14/02/2026 - 21/02/2026  

---

## 📦 O QUE SERÁ ENTREGUE

### ✅ Funcionalidades Incluídas:

#### 🔴 **CRÍTICO** (93-117h)
1. **Correção: Duplicidade de CNPJ por Empresa** (3-4h)
   - Permitir mesmo CNPJ em empresas diferentes
   - Ajustar banco de dados
   - Corrigir validações
   - Atualizar RLS

2. **Sistema de Conciliação Bancária Completo** (50-63h)
   - Tela com duas colunas lado a lado
   - Matching automático inteligente
   - Conciliar/Desconciliar com histórico
   - Dashboard de diferenças
   - Visualização de sobras e faltas

3. **Integração Open Finance** (40-50h)
   - Conectar com bancos via Pluggy
   - Gerenciar consentimentos
   - Importar transações automaticamente
   - Importar saldos
   - Logs de integração
   - Deduplicação automática

#### 🟡 **IMPORTANTE** (46-58h)
4. **Seletor de Contexto Empresarial** (6-8h)
   - Botão dedicado no header
   - Alternar entre empresas/grupos
   - Persistir seleção
   - Filtrar dados automaticamente

5. **Relatórios Financeiros** (25-30h)
   - Relatório: Conciliado vs Não Conciliado
   - Relatório: Fluxo de Caixa Realizado
   - Filtros por período e conta
   - Gráficos visuais
   - Exportação CSV

6. **Importação de Lançamentos CSV** (15-20h)
   - Upload de arquivos CSV
   - Validação de dados
   - Preview antes de importar
   - Relatório de erros
   - Template para download

#### 🟢 **REFINAMENTO** (4-5h)
7. **Notificações Toast** (4-5h)
   - Substituir Alerts por Toasts
   - Feedback visual moderno
   - Tipos: sucesso, erro, aviso, info

---

## ❌ O QUE NÃO SERÁ ENTREGUE (Fase Futura)

- Sistema de Categorias Hierárquico (15-18h)
- Botão de Ações Rápidas FAB (6-8h)
- Exportação PDF (apenas CSV incluído) (8-10h)
- Associação Usuários × Empresas avançada (10-12h)
- Atalhos de teclado (3-4h)
- Performance avançada (virtual scrolling) (4-5h)

**Total Excluído**: ~46-57h (pode ser implementado posteriormente)

---

## 📅 CRONOGRAMA DETALHADO (5 SEMANAS)

### **SEMANA 1: Correções e Fundação da Conciliação**
**Objetivo**: Preparar base técnica e iniciar conciliação

#### Dia 1 (15/01) - Quarta
- [x] ✅ Criar documentação completa do projeto
- [x] ✅ Correção: Duplicidade de CNPJ (3h) - CONCLUÍDA
  - Script de migração SQL criado
  - Código TypeScript atualizado
  - Documentação e testes criados

#### Dia 2 (16/01) - Quinta
- [ ] 🔴 Finalizar Correção CNPJ (1h)
- [ ] 🟡 Implementar Seletor de Contexto (6-8h)
  - Criar CompanyContext
  - Componente CompanySelector
  - Integrar no header

#### Dia 3 (17/01) - Sexta
- [ ] 🔴 Conciliação - Banco de Dados (4-5h)
  - Criar tabelas
  - Índices e RLS
  - Testar estrutura
- [ ] 🔴 Conciliação - Serviços (3-4h)
  - Criar reconciliation.ts
  - Funções base

**Entrega Semana 1**: Correção CNPJ ✅ + Seletor Contexto ✅ + Base de Conciliação ✅

---

### **SEMANA 2: Sistema de Conciliação Completo**
**Objetivo**: Conciliação 100% funcional

#### Dia 4 (20/01) - Segunda
- [ ] 🔴 Tela de Conciliação - Layout (8h)
  - Estrutura base
  - Duas colunas
  - Cards de transação e título

#### Dia 5 (21/01) - Terça
- [ ] 🔴 Tela de Conciliação - Lógica (8h)
  - Seleção de itens
  - Sugestões de matches
  - Modal de confirmação

#### Dia 6 (22/01) - Quarta
- [ ] 🔴 Conciliação - Funcionalidades (8h)
  - Implementar conciliar()
  - Implementar desfazer()
  - Tab de conciliados

#### Dia 7 (23/01) - Quinta
- [ ] 🔴 Conciliação - Dashboard Diferenças (6-7h)
  - Tab de diferenças
  - Sobras e faltas
  - Exportar CSV

#### Dia 8 (24/01) - Sexta
- [ ] 🔴 Conciliação - Testes e Ajustes (8h)
  - Testar fluxo completo
  - Corrigir bugs
  - Refinamentos de UX

**Entrega Semana 2**: Sistema de Conciliação 100% Funcional ✅

---

### **SEMANA 3: Integração Open Finance**
**Objetivo**: Importação automática de transações bancárias

#### Dia 9 (27/01) - Segunda
- [ ] 🔴 Open Finance - Setup (6-8h)
  - Criar conta Pluggy
  - Configurar credenciais
  - Criar tabelas BD
  - Serviço base

#### Dia 10 (28/01) - Terça
- [ ] 🔴 Open Finance - Consentimentos Parte 1 (8h)
  - Tela de conexões
  - Listar bancos
  - Modal de seleção

#### Dia 11 (29/01) - Quarta
- [ ] 🔴 Open Finance - Consentimentos Parte 2 (8h)
  - Integrar widget Pluggy
  - Criar consentimento
  - Salvar no banco

#### Dia 12 (30/01) - Quinta
- [ ] 🔴 Open Finance - Importação Parte 1 (8h)
  - Modal de importação
  - Chamar API Pluggy
  - Parsing de dados

#### Dia 13 (31/01) - Sexta
- [ ] 🔴 Open Finance - Importação Parte 2 (8h)
  - Deduplicação
  - Inserção em lote
  - Importar saldos
  - Logs de integração

**Entrega Semana 3**: Integração Open Finance Completa ✅

---

### **SEMANA 4: Relatórios e Importação CSV**
**Objetivo**: Relatórios financeiros e importação em lote

#### Dia 14 (03/02) - Segunda
- [ ] 🟡 Relatórios - Estrutura Base (8h)
  - Tela de relatórios
  - Filtros globais
  - Seletor de tipo

#### Dia 15 (04/02) - Terça
- [ ] 🟡 Relatório Conciliação (8h)
  - Cards de resumo
  - Gráficos
  - Tabela detalhada
  - Exportar CSV

#### Dia 16 (05/02) - Quarta
- [ ] 🟡 Relatório Fluxo de Caixa (8h)
  - Cards de resumo
  - Gráfico temporal
  - Tabela por período
  - Exportar CSV

#### Dia 17 (06/02) - Quinta
- [ ] 🟡 Importação CSV Parte 1 (8h)
  - Modal de upload
  - Parser CSV
  - Validação de dados

#### Dia 18 (07/02) - Sexta
- [ ] 🟡 Importação CSV Parte 2 (8h)
  - Preview de dados
  - Inserção em lote
  - Relatório de erros
  - Template para download

**Entrega Semana 4**: Relatórios Completos ✅ + Importação CSV ✅

---

### **SEMANA 5: Refinamentos e Testes Finais**
**Objetivo**: Sistema polido e pronto para produção

#### Dia 19 (10/02) - Segunda
- [ ] 🟢 Notificações Toast (4-5h)
  - Instalar biblioteca
  - Substituir Alerts
  - Testar em todas as telas

- [ ] 🔵 Cards Dashboard Conciliação (3-4h)
  - Adicionar cards no dashboard
  - Integrar com dados reais

#### Dia 20 (11/02) - Terça
- [ ] 🔵 Testes Integrados (8h)
  - Testar fluxo completo
  - Testar todos os perfis
  - Testar edge cases
  - Corrigir bugs críticos

#### Dia 21 (12/02) - Quarta
- [ ] 🔵 Ajustes e Correções (8h)
  - Corrigir bugs encontrados
  - Ajustes de UX
  - Validações finais

#### Dia 22 (13/02) - Quinta
- [ ] 🔵 Documentação e Deploy (8h)
  - Atualizar documentação
  - Guia do usuário
  - Preparar deploy
  - Testes finais

#### Dia 23 (14/02) - Sexta (RESERVA)
- [ ] 🔵 Buffer para Ajustes Finais (8h)
  - Correções de última hora
  - Polimento final
  - Preparar apresentação

**Entrega Semana 5**: Sistema MVP Completo Pronto para Produção ✅🎉

---

## 📊 DISTRIBUIÇÃO DE HORAS

| Semana | Foco | Horas |
|--------|------|-------|
| Semana 1 | Correções + Base Conciliação | 30-35h |
| Semana 2 | Conciliação Completa | 38-45h |
| Semana 3 | Open Finance | 40-50h |
| Semana 4 | Relatórios + CSV | 40-48h |
| Semana 5 | Refinamentos + Testes | 32-40h |
| **TOTAL** | | **180-218h** |

---

## ✅ CRITÉRIOS DE ACEITAÇÃO

### Para considerar o MVP Completo **PRONTO**:

#### Conciliação:
- [ ] Usuário consegue ver transações e títulos lado a lado
- [ ] Sistema sugere matches automaticamente
- [ ] Usuário consegue conciliar manualmente
- [ ] Sistema registra histórico
- [ ] Usuário consegue desfazer conciliação
- [ ] Dashboard mostra sobras e faltas
- [ ] Exportação de diferenças funciona

#### Open Finance:
- [ ] Usuário consegue conectar com banco via Pluggy
- [ ] Consentimentos são gerenciados corretamente
- [ ] Importação de transações funciona
- [ ] Não há duplicatas
- [ ] Saldos são atualizados
- [ ] Logs são registrados

#### Relatórios:
- [ ] Relatório de conciliação exibe dados corretos
- [ ] Relatório de fluxo de caixa exibe dados corretos
- [ ] Filtros funcionam
- [ ] Gráficos são exibidos
- [ ] Exportação CSV funciona

#### Importação CSV:
- [ ] Upload de arquivo funciona
- [ ] Validação detecta erros
- [ ] Preview mostra dados corretamente
- [ ] Importação insere dados no banco
- [ ] Relatório de erros é exibido

#### Geral:
- [ ] Seletor de contexto funciona
- [ ] Dados filtram por empresa selecionada
- [ ] Toasts substituem Alerts
- [ ] Sistema é responsivo
- [ ] Não há bugs críticos
- [ ] Performance é aceitável

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Hoje (15/01 - Dia 1):
1. [x] ✅ Documentação completa criada
2. [ ] **Começar Correção de CNPJ** (próxima tarefa)
   - Estimar: 2-3h hoje
3. [ ] Configurar ambiente de desenvolvimento (se necessário)

### Amanhã (16/01 - Dia 2):
1. [ ] Finalizar Correção CNPJ (1h)
2. [ ] Implementar Seletor de Contexto completo (6-8h)

---

## 📞 PONTOS DE CONTROLE

### Reuniões Semanais (sugerido):
- **Segunda-feira**: Review da semana anterior + Planning da semana
- **Sexta-feira**: Demo do que foi implementado

### Daily (sugerido):
- Atualizar **CHECKLIST-SPRINTS.md** diariamente
- Marcar progresso
- Reportar bloqueios

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Credenciais Pluggy atrasam | Média | Alto | Começar por outras tarefas, deixar Open Finance por último |
| Bugs complexos na Conciliação | Alta | Médio | Semana 5 é buffer, pode absorver |
| Performance em listas grandes | Média | Médio | Implementar paginação se necessário |
| Integração Pluggy falha | Baixa | Alto | Testar early, ter plano B (importação manual) |

---

## 💰 INVESTIMENTO

**Horas**: 140-175h (média 157h)  
**Valor/hora**: R$ 100-150  
**Total Estimado**: R$ 14.000 - R$ 26.250  
**Valor Médio**: ~R$ 20.000  

---

## 🎉 ENTREGÁVEIS FINAIS

Ao final das 5 semanas, você terá:

1. ✅ Sistema de Conciliação Bancária completo
2. ✅ Integração Open Finance funcionando
3. ✅ Relatórios financeiros essenciais
4. ✅ Importação em lote via CSV
5. ✅ Seletor de contexto empresarial
6. ✅ Notificações modernas (toast)
7. ✅ Sistema testado e pronto para produção
8. ✅ Documentação completa atualizada

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Credenciais Necessárias:
- [ ] **Pluggy**: Client ID e Client Secret
  - Se não tiver, criar conta em: https://pluggy.ai
  - Pode levar 1-2 dias para aprovação

### Premissas:
- Desenvolvedores trabalham 8h/dia
- Ambiente de desenvolvimento já configurado
- Acesso ao Supabase configurado
- Sem mudanças de escopo durante execução

### Flexibilidade:
- Semana 5 é **buffer** para absorver atrasos
- Se tudo correr bem, entrega pode ser antecipada para 10-12/02
- Funcionalidades excluídas podem ser implementadas em fase 2

---

**Status**: ✅ **APROVADO - PRONTO PARA INICIAR**  
**Próxima Ação**: Começar Correção de CNPJ (3-4h)  
**Responsável**: Equipe de Desenvolvimento  
**Data de Revisão**: Final de cada semana  

---

**Documento criado em**: 15/01/2026  
**Versão**: 1.0  
**Aprovado por**: Cliente  
