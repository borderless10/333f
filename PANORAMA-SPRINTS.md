# 📊 PANORAMA GERAL - O QUE FALTA IMPLEMENTAR

## 🎯 Status Geral do Projeto

### ✅ **JÁ IMPLEMENTADO** (Base do Sistema)
- ✅ Tela de Login com Glassmorphism
- ✅ Autenticação com Supabase
- ✅ Sistema de Perfis (Admin / Analista / Viewer)
- ✅ CRUD de Empresas com validação de CNPJ
- ✅ CRUD de Títulos a Pagar/Receber
- ✅ CRUD de Transações
- ✅ CRUD de Contas Bancárias
- ✅ Dashboard básico com cards de resumo
- ✅ Proteção de rotas por perfil
- ✅ Formatação automática de valores (R$)
- ✅ Tema Dark com Glassmorphism

---

## 🚀 SPRINT 1 – Acesso e Conexão Bancária

### 📋 Requisitos da Sprint 1

#### ✅ **COMPLETO**: Módulo de Autenticação e Perfis
- Status: **100% IMPLEMENTADO**
- O que foi feito:
  - Login funcional
  - Sistema de perfis (Admin/Analista/Viewer)
  - Proteção de rotas
  - Gerenciamento de usuários

#### ✅ **COMPLETO**: Cadastro de Empresas
- Status: **100% IMPLEMENTADO**
- O que foi feito:
  - CRUD completo
  - Validação de CNPJ
  - Formatação automática
  
#### ⚠️ **PROBLEMA IDENTIFICADO**: Regra de Duplicidade de CNPJ
- Status: **CORREÇÃO NECESSÁRIA**
- Problema Atual: Sistema impede duplicidade global de CNPJ
- Problema Esperado: Deve impedir duplicidade apenas dentro da mesma empresa Télos Control
- Horas Estimadas: **3-4h**

**Tarefas:**
1. Alterar estrutura do banco de dados para incluir `empresa_telos_id` (1h)
2. Modificar validação de CNPJ para considerar contexto da empresa (1h)
3. Atualizar RLS policies para filtrar por empresa (1h)
4. Testar cenários de duplicidade entre empresas diferentes (1h)

#### ❌ **FALTA IMPLEMENTAR**: Integração Open Finance (AIS)
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **40-50h**

**Tarefas:**

##### 1. Configuração Inicial Pluggy/Open Finance (6-8h)
- [ ] Criar conta no Pluggy ou similar
- [ ] Configurar credenciais API
- [ ] Criar tabela `integracao_bancaria` no banco
- [ ] Criar tabela `consentimentos_open_finance`
- [ ] Implementar serviço base de integração

##### 2. Gestão de Consentimentos (12-15h)
- [ ] Tela de lista de consentimentos
- [ ] Modal para criar novo consentimento
- [ ] Fluxo de autenticação com banco (redirect/webview)
- [ ] Visualização de status do consentimento
- [ ] Renovar consentimento
- [ ] Revogar consentimento
- [ ] Notificações de consentimento próximo do vencimento

##### 3. Importação de Dados Bancários (15-20h)
- [ ] Botão "Importar Transações" na tela de Contas
- [ ] Seletor de período para importação
- [ ] Chamada à API Open Finance para buscar transações
- [ ] Parsing e normalização dos dados
- [ ] Deduplicação de transações (evitar importar 2x)
- [ ] Sincronizar com tabela `transacoes`
- [ ] Importar saldos e atualizar contas
- [ ] Feedback visual do progresso de importação

##### 4. Logs de Integração (7-10h)
- [ ] Criar tabela `logs_integracao`
- [ ] Registrar todas chamadas à API
- [ ] Tela de visualização de logs (apenas Admin)
- [ ] Filtros por data, status, tipo
- [ ] Detalhes de erros
- [ ] Retry manual de importações falhadas

---

## 🔄 SPRINT 2 – Conciliação Básica

### 📋 Requisitos da Sprint 2

#### ❌ **FALTA IMPLEMENTAR**: Sistema de Conciliação
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **45-55h**

**Tarefas:**

##### 1. Estrutura de Banco de Dados (4-5h)
- [ ] Criar tabela `conciliacoes`
- [ ] Campos: id, transacao_id, titulo_id, status, diferenca_valor, usuario_id, data_conciliacao
- [ ] Criar índices para performance
- [ ] RLS policies

##### 2. Tela de Conciliação (20-25h)
- [ ] Nova tela "Conciliação" no menu
- [ ] Layout duas colunas lado a lado:
  - Coluna Esquerda: Transações Bancárias (importadas)
  - Coluna Direita: Lançamentos ERP (títulos)
- [ ] Rolagem independente em cada coluna
- [ ] Cards de transação com destaque visual
- [ ] Seletor de período/conta
- [ ] Filtros por status (pendente/conciliado/com diferença)

##### 3. Matching 1 a 1 (12-15h)
- [ ] Selecionar transação bancária (lado esquerdo)
- [ ] Selecionar lançamento ERP (lado direito)
- [ ] Botão "Conciliar" aparecer ao selecionar ambos
- [ ] Validação de matching:
  - Valor igual ou próximo (tolerância configurável)
  - Data próxima (±3 dias configurável)
- [ ] Visual de diferença se valores não batem
- [ ] Modal de confirmação mostrando detalhes

##### 4. Estados de Conciliação (5-6h)
- [ ] Status: `pendente` (não conciliado)
- [ ] Status: `conciliado` (match perfeito)
- [ ] Status: `conciliado_com_diferenca` (match com diferença de valor)
- [ ] Cores distintas para cada status (badges)

##### 5. Desfazer Conciliação (4-5h)
- [ ] Botão "Desfazer" em item conciliado
- [ ] Confirmação antes de desfazer
- [ ] Manter histórico em tabela `historico_conciliacoes`
- [ ] Restaurar status "pendente" nas transações

##### 6. Visualização de Diferenças (5-7h)
- [ ] Card de resumo: total conciliado vs pendente
- [ ] Lista de sobras (transações sem match)
- [ ] Lista de faltas (títulos sem match)
- [ ] Exportar lista de diferenças (CSV)

---

## 📊 SPRINT 3 – Operações e Relatórios Iniciais

### 📋 Requisitos da Sprint 3

#### ✅ **PARCIALMENTE COMPLETO**: CRUD de Títulos
- Status: **80% IMPLEMENTADO**
- O que foi feito: CRUD básico funcional
- O que falta: Campos específicos do design (fornecedor vs cliente separados)
- Horas Estimadas: **2-3h**

**Tarefas:**
- [ ] Adicionar campo `tipo_pessoa` (fornecedor/cliente) no formulário
- [ ] Melhorar UX do formulário
- [ ] Validações específicas

#### ❌ **FALTA IMPLEMENTAR**: Importação de Lançamentos em Lote (CSV)
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **15-20h**

**Tarefas:**

##### 1. Funcionalidade de Upload CSV (8-10h)
- [ ] Botão "Importar Lançamentos" na tela de Títulos
- [ ] Modal de upload com drag & drop
- [ ] Validação de formato CSV
- [ ] Template CSV para download
- [ ] Preview dos dados antes de importar
- [ ] Validação linha por linha
- [ ] Relatório de erros de importação

##### 2. Parser e Validação (7-10h)
- [ ] Biblioteca para parsing CSV
- [ ] Mapear colunas obrigatórias
- [ ] Validar formatos (datas, valores, CNPJ)
- [ ] Checar duplicatas
- [ ] Inserção em lote no banco
- [ ] Tratamento de erros robusto

#### ❌ **FALTA IMPLEMENTAR**: Relatórios
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **25-30h**

**Tarefas:**

##### 1. Tela de Relatórios (8-10h)
- [ ] Nova tela "Relatórios" no menu
- [ ] Seletor de tipo de relatório
- [ ] Filtros: período, conta, empresa
- [ ] Loading states
- [ ] Botões de exportação (CSV/PDF)

##### 2. Relatório: Extrato Conciliado vs Não Conciliado (8-10h)
- [ ] Listagem de transações com status de conciliação
- [ ] Totalizadores por status
- [ ] Agrupamento por período (dia/semana/mês)
- [ ] Gráfico visual (barra/pizza)
- [ ] Exportação em CSV e PDF

##### 3. Relatório: Fluxo de Caixa Realizado (9-12h)
- [ ] Entrada vs Saída por período
- [ ] Saldo acumulado
- [ ] Gráfico de linha temporal
- [ ] Drill-down para detalhes
- [ ] Comparação com período anterior
- [ ] Exportação

#### ✅ **PARCIALMENTE COMPLETO**: Painel Inicial (Dashboard)
- Status: **50% IMPLEMENTADO**
- O que foi feito: Dashboard com cards básicos
- O que falta: Seletor de contexto empresarial e status de conciliação
- Horas Estimadas: **12-15h**

**Tarefas:**

##### 1. Seletor de Contexto Empresarial (6-8h)
- [ ] Botão no header para selecionar empresa
- [ ] Modal com lista de empresas/grupos
- [ ] Busca de empresas
- [ ] Salvar contexto selecionado
- [ ] Atualizar todos os dados ao mudar contexto
- [ ] Badge mostrando empresa atual

##### 2. Cards de Status de Conciliação (6-7h)
- [ ] Card "Dias em Aberto"
- [ ] Card "Valor Desconciliado Total"
- [ ] Card "Lançamentos Pendentes"
- [ ] Integrar com dados reais de conciliação
- [ ] Links para tela de conciliação

---

## 👥 SPRINT 4 – Multiusuários e Refinamentos

### 📋 Requisitos da Sprint 4

#### ✅ **COMPLETO**: Permissões Básicas
- Status: **100% IMPLEMENTADO**
- O que foi feito:
  - Admin, Analista, Viewer funcionando
  - Proteção de rotas
  - Gerenciamento de usuários

#### ❌ **FALTA IMPLEMENTAR**: Associação Usuários a Grupos/Empresas
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **10-12h**

**Tarefas:**

##### 1. Modelo de Dados (3-4h)
- [ ] Criar tabela `usuario_empresa` (relacionamento N:N)
- [ ] Criar tabela `grupos_empresariais`
- [ ] RLS policies considerando associações
- [ ] Migração de dados existentes

##### 2. Tela de Gerenciamento (7-8h)
- [ ] Na tela de Usuários, botão "Gerenciar Empresas"
- [ ] Modal com checklist de empresas
- [ ] Associar/desassociar empresas do usuário
- [ ] Visualizar empresas do usuário
- [ ] Validações (admin tem acesso a tudo)

#### ⚠️ **PARCIALMENTE COMPLETO**: Ajustes de Usabilidade
- Status: **30% IMPLEMENTADO**
- Horas Estimadas: **8-10h**

**Tarefas:**

##### 1. Rolagem Independente (1-2h)
- [ ] Implementar na tela de Conciliação (duas colunas)
- [x] Já funciona nas outras telas

##### 2. Atalhos Básicos (3-4h)
- [ ] Implementar atalhos de teclado (web)
- [ ] Ctrl+N para novo lançamento
- [ ] Ctrl+F para busca
- [ ] ESC para fechar modais
- [ ] Enter para salvar formulários

##### 3. Melhorias de Performance (4-5h)
- [ ] Paginação em listas longas
- [ ] Virtual scrolling
- [ ] Lazy loading de imagens/dados
- [ ] Otimização de queries

#### ⚠️ **PARCIALMENTE COMPLETO**: Exportação CSV/PDF
- Status: **0% IMPLEMENTADO**
- Horas Estimadas: **12-15h**

**Tarefas:**

##### 1. Exportação CSV (4-5h)
- [ ] Biblioteca CSV
- [ ] Implementar em todas as telas principais
- [ ] Incluir filtros aplicados
- [ ] Nome de arquivo com timestamp

##### 2. Exportação PDF (8-10h)
- [ ] Biblioteca PDF (react-native-pdf ou similar)
- [ ] Templates de relatórios
- [ ] Cabeçalho com logo/empresa
- [ ] Tabelas formatadas
- [ ] Gráficos em PDF
- [ ] Orientação paisagem/retrato

---

## 🎨 MELHORIAS DE DESIGN E UX (Conforme Requisitos do Cliente)

### Status: **40% IMPLEMENTADO**
### Horas Estimadas: **25-30h**

#### ❌ **FALTA IMPLEMENTAR**: Seletor de Contexto Dedicado
- Horas Estimadas: **6-8h**
- [ ] Botão dedicado no header (não no menu de perfil)
- [ ] Pesquisa de empresas/grupos
- [ ] Alternância rápida entre contextos
- [ ] Persistir contexto selecionado

#### ❌ **FALTA IMPLEMENTAR**: Menu de Perfil Completo
- Horas Estimadas: **3-4h**
- [ ] Opções: Logout, Tela Inicial, Configurações
- [ ] Modal ou dropdown
- [ ] Avatar do usuário
- [ ] Nome e e-mail

#### ❌ **FALTA IMPLEMENTAR**: Botão de Ações Rápidas Flutuante
- Horas Estimadas: **6-8h**
- [ ] Botão FAB (Floating Action Button) fixo inferior central
- [ ] Menu expansível com opções contextuais:
  - Novo Lançamento
  - Nova Transação
  - Importar Dados
  - Conciliar
- [ ] Animações suaves
- [ ] Apenas para Admin e Analista

#### ❌ **FALTA IMPLEMENTAR**: Sistema de Categorias Hierárquico (Plano de Contas)
- Horas Estimadas: **15-18h**

**Tarefas:**

##### 1. Modelo de Dados (4-5h)
- [ ] Criar tabela `plano_contas`
- [ ] Campos: id, codigo, nome, nivel, categoria_pai_id, editavel
- [ ] Popular N1 (categorias travadas do sistema)
- [ ] RLS policies

##### 2. Tela de Gestão (6-8h)
- [ ] Nova tela "Plano de Contas" no menu
- [ ] Visualização em árvore hierárquica
- [ ] Adicionar subcategorias (N2+)
- [ ] Editar categorias criadas pelo usuário
- [ ] Não permitir editar N1

##### 3. Padronização Automática (5-6h)
- [ ] Detectar nível mais profundo
- [ ] Duplicar automaticamente categorias N2 para N3 se necessário
- [ ] Interface para usuário revisar e editar

#### ❌ **FALTA IMPLEMENTAR**: Notificações Toast
- Horas Estimadas: **4-5h**
- [ ] Biblioteca de toast (react-native-toast-notifications)
- [ ] Substituir Alerts por Toasts
- [ ] Tipos: sucesso, erro, aviso, info
- [ ] Posicionamento consistente
- [ ] Duração automática

#### ⚠️ **MELHORAR**: Fluxo de Criação de Lançamentos
- Horas Estimadas: **6-8h**
- [ ] Simplificar formulário (menos campos na tela inicial)
- [ ] Campos opcionais em "Avançado"
- [ ] Validação em tempo real
- [ ] Auto-complete em campos comuns
- [ ] Salvar como rascunho

---

## 📊 RESUMO DE HORAS POR SPRINT

### **SPRINT 1 – Acesso e Conexão Bancária**
| Item | Status | Horas |
|------|--------|-------|
| Autenticação e Perfis | ✅ Completo | 0h |
| Cadastro de Empresas | ✅ Completo | 0h |
| Correção: Duplicidade CNPJ | ⚠️ Correção | **3-4h** |
| Integração Open Finance | ❌ Falta | **40-50h** |
| **TOTAL SPRINT 1** | | **43-54h** |

### **SPRINT 2 – Conciliação Básica**
| Item | Status | Horas |
|------|--------|-------|
| Estrutura de BD | ❌ Falta | **4-5h** |
| Tela de Conciliação | ❌ Falta | **20-25h** |
| Matching 1-1 | ❌ Falta | **12-15h** |
| Estados de Conciliação | ❌ Falta | **5-6h** |
| Desfazer Conciliação | ❌ Falta | **4-5h** |
| Visualização de Diferenças | ❌ Falta | **5-7h** |
| **TOTAL SPRINT 2** | | **50-63h** |

### **SPRINT 3 – Operações e Relatórios Iniciais**
| Item | Status | Horas |
|------|--------|-------|
| Melhorias CRUD Títulos | ⚠️ Parcial | **2-3h** |
| Importação CSV | ❌ Falta | **15-20h** |
| Tela de Relatórios | ❌ Falta | **8-10h** |
| Relatório Conciliação | ❌ Falta | **8-10h** |
| Relatório Fluxo de Caixa | ❌ Falta | **9-12h** |
| Seletor de Contexto | ❌ Falta | **6-8h** |
| Cards de Conciliação | ❌ Falta | **6-7h** |
| **TOTAL SPRINT 3** | | **54-70h** |

### **SPRINT 4 – Multiusuários e Refinamentos**
| Item | Status | Horas |
|------|--------|-------|
| Permissões Básicas | ✅ Completo | 0h |
| Associação Usuários/Empresas | ❌ Falta | **10-12h** |
| Ajustes de Usabilidade | ⚠️ Parcial | **8-10h** |
| Exportação CSV/PDF | ❌ Falta | **12-15h** |
| **TOTAL SPRINT 4** | | **30-37h** |

### **MELHORIAS DE DESIGN E UX**
| Item | Status | Horas |
|------|--------|-------|
| Seletor de Contexto Dedicado | ❌ Falta | **6-8h** |
| Menu de Perfil Completo | ❌ Falta | **3-4h** |
| Botão Ações Rápidas FAB | ❌ Falta | **6-8h** |
| Sistema de Categorias (Plano de Contas) | ❌ Falta | **15-18h** |
| Notificações Toast | ❌ Falta | **4-5h** |
| Melhorar Fluxo de Lançamentos | ⚠️ Melhorar | **6-8h** |
| **TOTAL DESIGN/UX** | | **40-51h** |

---

## 🎯 **TOTAL GERAL DE HORAS ESTIMADAS**

| Sprint | Horas Mínimas | Horas Máximas |
|--------|---------------|---------------|
| Sprint 1 | 43h | 54h |
| Sprint 2 | 50h | 63h |
| Sprint 3 | 54h | 70h |
| Sprint 4 | 30h | 37h |
| Design/UX | 40h | 51h |
| **TOTAL** | **217h** | **275h** |

### 📊 **Conversão em Dias Úteis** (8h/dia)
- **Mínimo**: ~27 dias úteis (~5-6 semanas)
- **Máximo**: ~34 dias úteis (~7 semanas)

---

## 🎯 PRIORIZAÇÃO RECOMENDADA

### **🔥 ALTA PRIORIDADE** (Funcionalidades Core do MVP)
1. **Correção de Duplicidade de CNPJ por Empresa** (Sprint 1) - 3-4h
2. **Sistema de Conciliação Completo** (Sprint 2) - 50-63h
3. **Relatório de Fluxo de Caixa** (Sprint 3) - 9-12h
4. **Seletor de Contexto Empresarial** (Sprint 3) - 6-8h
5. **Notificações Toast** (Design/UX) - 4-5h

**Subtotal Alta Prioridade**: 72-92h (~9-11 dias úteis)

### **🟡 MÉDIA PRIORIDADE** (Agregam Valor Significativo)
1. **Integração Open Finance** (Sprint 1) - 40-50h
2. **Importação de Lançamentos CSV** (Sprint 3) - 15-20h
3. **Relatórios Iniciais** (Sprint 3) - 16-20h
4. **Associação Usuários/Empresas** (Sprint 4) - 10-12h
5. **Botão de Ações Rápidas** (Design/UX) - 6-8h

**Subtotal Média Prioridade**: 87-110h (~11-14 dias úteis)

### **🟢 BAIXA PRIORIDADE** (Refinamentos e Nice-to-Have)
1. **Sistema de Categorias Hierárquico** (Design/UX) - 15-18h
2. **Exportação CSV/PDF** (Sprint 4) - 12-15h
3. **Ajustes de Usabilidade** (Sprint 4) - 8-10h
4. **Melhorias no Fluxo de Lançamentos** (Design/UX) - 6-8h

**Subtotal Baixa Prioridade**: 41-51h (~5-6 dias úteis)

---

## 📝 OBSERVAÇÕES IMPORTANTES

### 1. **Arquitetura Multi-tenant**
O sistema precisa ser ajustado para suportar múltiplas empresas como a Télos Control, cada uma com seus próprios clientes. Isso afeta:
- Estrutura de banco de dados (adicionar nível de empresa_telos_id)
- RLS policies
- Validações
- Contexto de usuário

**Estimativa de Refatoração**: **15-20h adicionais**

### 2. **Banco de Dados da Imagem**
O diagrama do banco de dados fornecido mostra uma estrutura muito mais complexa do que a atual. Será necessário:
- Analisar todas as tabelas
- Criar migrations
- Adaptar código existente
- Testar integrações

**Estimativa de Implementação Completa do BD**: **25-30h adicionais**

### 3. **Layout Télos ERP da Imagem**
O design mostrado na imagem tem diferenças do atual:
- Side menu mais completo
- Navegação diferente
- Componentes adicionais

**Estimativa de Adequação ao Design**: **20-25h adicionais**

---

## 🎯 RECOMENDAÇÃO FINAL

### **MVP Mínimo Viável para Demonstração** (~120-140h / 15-17 dias úteis)
1. Corrigir duplicidade de CNPJ (3-4h)
2. Implementar Conciliação Básica (50-63h)
3. Adicionar Seletor de Contexto (6-8h)
4. Implementar Relatório de Fluxo de Caixa (9-12h)
5. Adicionar Notificações Toast (4-5h)
6. Integração Open Finance Simplificada (40-50h)

### **Sistema Completo Conforme Sprints** (~220-280h / 27-35 dias úteis)
Implementar todas as funcionalidades das 4 sprints + melhorias de design.

---

**Documento gerado em**: 15/01/2026
**Versão**: 1.0
**Base**: Análise do código existente + Requisitos do cliente
