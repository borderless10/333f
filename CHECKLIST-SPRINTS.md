# ✅ CHECKLIST DETALHADO - SPRINTS 1 A 4

## 🎯 Como usar este checklist:
- [ ] = Não iniciado
- [x] = Concluído
- [~] = Em progresso
- [!] = Bloqueado/Problema

---

## 📋 SPRINT 1 – ACESSO E CONEXÃO BANCÁRIA

### ✅ Módulo de Autenticação e Perfis (COMPLETO)
- [x] Tela de login funcional
- [x] Sistema de perfis (Admin/Analista/Viewer)
- [x] Proteção de rotas
- [x] Gerenciamento de usuários
- [x] RLS configurado

**Status**: ✅ 100% COMPLETO

---

### ✅ Cadastro de Empresas (COMPLETO)
- [x] CRUD completo
- [x] Validação de CNPJ
- [x] Formatação automática
- [x] Filtros e busca
- [x] Modal responsivo

**Status**: ✅ 100% COMPLETO

---

### ✅ Correção: Duplicidade de CNPJ por Empresa
**Tempo Estimado**: 3-4h  
**Tempo Real**: 3h  
**Concluído em**: 15/01/2026

#### Banco de Dados (1h)
- [x] Criar tabela `empresas_telos`
- [x] Adicionar campo `empresa_telos_id` em `empresas`
- [x] Adicionar campo `empresa_telos_id` em `perfis`
- [x] Remover constraint `empresas_cnpj_key`
- [x] Criar índice único composto (cnpj, empresa_telos_id)
- [x] Migrar dados existentes
- [x] Criar função helper `get_user_empresa_telos_id()`

#### Código (1h)
- [x] Atualizar interface `Company` em `companies.ts`
- [x] Adicionar interface `EmpresaTelos`
- [x] Criar função `buscarEmpresaTelosDoUsuario()`
- [x] Criar função `buscarEmpresasTelos()`
- [x] Criar função `validarCNPJDuplicado()`
- [x] Atualizar função `criarEmpresa()`
- [x] Atualizar função `atualizarEmpresa()`

#### RLS Policies (1h)
- [x] Atualizar política de SELECT em empresas
- [x] Atualizar política de INSERT
- [x] Atualizar política de UPDATE
- [x] Atualizar política de DELETE
- [x] Criar policies para `empresas_telos`

#### Testes e Documentação (1h)
- [x] Criar script `migration-cnpj-fix.sql`
- [x] Criar script `test-cnpj-migration.sql`
- [x] Criar `GUIA-MIGRACAO-CNPJ.md`
- [x] Criar `IMPLEMENTACAO-CNPJ-COMPLETA.md`
- [ ] ⏳ Executar migração no Supabase (próximo passo)
- [ ] ⏳ Testar no app React Native

**Status**: ✅ **CÓDIGO COMPLETO** - Pronto para migração no Supabase

---

### ❌ Integração Open Finance (AIS)
**Tempo Estimado**: 40-50h

#### 1. Configuração Inicial (6-8h)
- [ ] Criar conta no Pluggy
- [ ] Obter Client ID e Client Secret
- [ ] Configurar variáveis de ambiente
- [ ] Criar tabela `conexoes_bancarias`
- [ ] Criar tabela `consentimentos_open_finance`
- [ ] Criar tabela `logs_integracao`
- [ ] Implementar serviço base `lib/services/open-finance.ts`
- [ ] Função `getPluggyToken()`
- [ ] Função `listarBancos()`
- [ ] Configurar RLS

#### 2. Gestão de Consentimentos (12-15h)
- [ ] Criar tela `app/(tabs)/bank-connections.tsx`
- [ ] Componente `ConnectionCard`
- [ ] Lista de conexões existentes
- [ ] Modal de seleção de banco
- [ ] Componente `BankSelector`
- [ ] Integrar widget Pluggy Connect
- [ ] Implementar fluxo de autenticação
- [ ] Processar retorno do Pluggy
- [ ] Salvar conexão no banco
- [ ] Função `renovarConsentimento()`
- [ ] Função `revogarConsentimento()`
- [ ] Badge de status do consentimento
- [ ] Notificação de consentimento próximo ao vencimento

#### 3. Importação de Dados Bancários (15-20h)
- [ ] Adicionar botão "Importar Transações" na tela de Contas
- [ ] Criar modal `ImportTransactionsModal`
- [ ] Seletor de período (data início/fim)
- [ ] Exibir informações da conta e banco
- [ ] Barra de progresso durante importação
- [ ] Função `handleImport()` principal
- [ ] Chamar API Pluggy para buscar transações
- [ ] Normalizar dados das transações
- [ ] Adicionar campo `pluggy_transaction_id` na tabela transacoes
- [ ] Implementar deduplicação
- [ ] Inserção em lote no banco
- [ ] Função `importarSaldos()`
- [ ] Atualizar saldo da conta
- [ ] Registrar timestamp de última sincronização
- [ ] Feedback visual de sucesso/erro

#### 4. Logs de Integração (7-10h)
- [ ] Criar tela `app/(tabs)/integration-logs.tsx`
- [ ] Componente `LogCard`
- [ ] Filtro por tipo (importação/consentimento/erro)
- [ ] Filtro por status (sucesso/erro/processando)
- [ ] Filtro por período
- [ ] Lista de logs paginada
- [ ] Expandir detalhes do log (JSON)
- [ ] Botão "Tentar Novamente" para erros
- [ ] Função `retryImport()`
- [ ] Badge colorido por status
- [ ] Proteção: apenas Admin visualiza logs

**Status**: ❌ NÃO INICIADO

---

## 📋 SPRINT 2 – CONCILIAÇÃO BÁSICA

### ❌ Sistema Completo de Conciliação
**Tempo Estimado**: 50-63h

#### 1. Estrutura de Banco de Dados (4-5h)
- [ ] Criar tabela `conciliacoes`
  - [ ] Campos: id, transacao_id, titulo_id, status
  - [ ] Campo diferenca_valor (DECIMAL)
  - [ ] Campo diferenca_dias (INTEGER)
  - [ ] Campo observacoes (TEXT)
  - [ ] Campo usuario_id (UUID)
  - [ ] Campo data_conciliacao (TIMESTAMPTZ)
- [ ] Criar tabela `historico_conciliacoes`
  - [ ] Campos: id, conciliacao_id, acao
  - [ ] Campo usuario_id, data_acao
  - [ ] Campo dados_anteriores (JSONB)
- [ ] Criar índices
  - [ ] idx_conciliacoes_transacao
  - [ ] idx_conciliacoes_titulo
  - [ ] idx_conciliacoes_status
  - [ ] idx_historico_conciliacao
- [ ] Configurar RLS em conciliacoes
- [ ] Configurar RLS em historico_conciliacoes
- [ ] Criar políticas de SELECT/INSERT/UPDATE/DELETE

#### 2. Serviço de Conciliação (6-8h)
- [ ] Criar arquivo `lib/services/reconciliation.ts`
- [ ] Interface `Reconciliation`
- [ ] Função `buscarItensPendentes(empresaId)`
  - [ ] Buscar transações não conciliadas
  - [ ] Buscar títulos pendentes
- [ ] Função `sugerirMatches(transacao, titulos, tolerancias)`
  - [ ] Comparar valores (tolerância configurável)
  - [ ] Comparar datas (±3 dias padrão)
  - [ ] Validar tipo (receita=receber, despesa=pagar)
- [ ] Função `conciliar(transacaoId, tituloId, observacoes)`
  - [ ] Buscar transação e título
  - [ ] Calcular diferenças
  - [ ] Determinar status (conciliado vs com_diferenca)
  - [ ] Inserir na tabela conciliacoes
  - [ ] Registrar em histórico
- [ ] Função `desfazerConciliacao(conciliacaoId)`
  - [ ] Buscar dados da conciliação
  - [ ] Registrar em histórico
  - [ ] Deletar conciliação
- [ ] Função `buscarConciliados(empresaId)`
- [ ] Função `calcularEstatisticas(empresaId)`

#### 3. Tela de Conciliação - UI (20-25h)
- [ ] Criar arquivo `app/(tabs)/reconciliation.tsx`
- [ ] Layout base com `AnimatedBackground`
- [ ] Header com filtros
  - [ ] `CompanySelector`
  - [ ] `DateRangePicker`
  - [ ] `AccountFilter`
- [ ] Cards de resumo
  - [ ] Card "Dias em Aberto"
  - [ ] Card "Valor Desconciliado"
  - [ ] Card "Lançamentos Pendentes"
- [ ] Layout duas colunas (50/50)
  - [ ] Coluna esquerda: Transações Bancárias
  - [ ] Coluna direita: Títulos ERP
  - [ ] Rolagem independente em cada
- [ ] Componente `TransactionCard`
  - [ ] Visual de card com glassmorphism
  - [ ] Highlight quando selecionado
  - [ ] Ícone de tipo (receita/despesa)
  - [ ] Exibir: descrição, valor, data, conta
  - [ ] Badge de sugestão quando há matches
- [ ] Componente `TituloCard`
  - [ ] Layout similar ao TransactionCard
  - [ ] Highlight quando selecionado
  - [ ] Badge "Sugerido" quando é match
  - [ ] Exibir: descrição, fornecedor/cliente, valor, vencimento
- [ ] Estado de seleção
  - [ ] `transacaoSelecionada`
  - [ ] `tituloSelecionado`
  - [ ] `matchesSugeridos`
- [ ] Lógica de seleção
  - [ ] Ao selecionar transação, buscar matches
  - [ ] Destacar títulos sugeridos
  - [ ] Permitir selecionar qualquer título

#### 4. Modal de Confirmação (3-4h)
- [ ] Componente `ReconcileModal`
- [ ] Layout com comparação lado a lado
  - [ ] Dados da transação (esquerda)
  - [ ] Dados do título (direita)
  - [ ] Seta de comparação no centro
- [ ] Calcular e exibir diferenças
  - [ ] Diferença de valor (se houver)
  - [ ] Diferença de dias (se houver)
  - [ ] Warning visual se diferença > 0
- [ ] Campo de observações (textarea)
- [ ] Botões de ação
  - [ ] Cancelar (fecha modal)
  - [ ] Confirmar (executa conciliação)
- [ ] Estado de loading durante conciliação
- [ ] Tratamento de erros

#### 5. Botão Conciliar e Lógica (3-4h)
- [ ] Exibir botão apenas quando ambos selecionados
- [ ] Posicionar no centro inferior (fixed)
- [ ] Estilo glassmorphism + animação
- [ ] Função `handleReconcile()`
  - [ ] Validar seleções
  - [ ] Abrir modal de confirmação
- [ ] Função `confirmarConciliacao(observacoes)`
  - [ ] Chamar serviço de conciliação
  - [ ] Exibir toast de sucesso/erro
  - [ ] Limpar seleções
  - [ ] Recarregar listas
  - [ ] Atualizar estatísticas

#### 6. Tab de Conciliados (4-5h)
- [ ] Adicionar TabView na tela
  - [ ] Tab "Pendentes" (padrão)
  - [ ] Tab "Conciliados"
- [ ] Componente `ConciliadoCard`
  - [ ] Exibir transação + título conciliados
  - [ ] Badge de status (conciliado vs com_diferenca)
  - [ ] Diferença destacada se houver
  - [ ] Data de conciliação
  - [ ] Usuário que conciliou
  - [ ] Botão "Desfazer"
- [ ] Modal de confirmação para desfazer
  - [ ] Warning de ação irreversível
  - [ ] Botões Cancelar/Confirmar
- [ ] Função `handleDesfazer(conciliacaoId)`
  - [ ] Chamar serviço
  - [ ] Toast de confirmação
  - [ ] Recarregar listas

#### 7. Tab de Diferenças (5-7h)
- [ ] Adicionar Tab "Diferenças"
- [ ] Card de resumo
  - [ ] Total Conciliado
  - [ ] Total Pendente
  - [ ] Taxa de Conciliação (%)
  - [ ] Gráfico de pizza (opcional)
- [ ] Seção "Sobras"
  - [ ] Título e descrição
  - [ ] Lista de transações sem match
  - [ ] Contador de sobras
- [ ] Seção "Faltas"
  - [ ] Título e descrição
  - [ ] Lista de títulos sem match
  - [ ] Contador de faltas
- [ ] Botão "Exportar Diferenças"
  - [ ] Gerar CSV com sobras e faltas
  - [ ] Nome do arquivo com timestamp
  - [ ] Toast de confirmação

#### 8. Testes e Refinamentos (4-5h)
- [ ] Testar fluxo completo
  - [ ] Selecionar transação
  - [ ] Verificar sugestões
  - [ ] Selecionar título
  - [ ] Confirmar conciliação
- [ ] Testar conciliação com diferença
- [ ] Testar desfazer conciliação
- [ ] Testar filtros e buscas
- [ ] Testar performance com muitos itens
- [ ] Ajustar responsividade
- [ ] Validar mensagens de erro
- [ ] Documentar código

**Status**: ❌ NÃO INICIADO

---

## 📋 SPRINT 3 – OPERAÇÕES E RELATÓRIOS INICIAIS

### ⚠️ Melhorias no CRUD de Títulos
**Tempo Estimado**: 2-3h

- [ ] Adicionar campo `tipo_pessoa` (fornecedor/cliente)
- [ ] Separar input de fornecedor vs cliente
- [ ] Melhorar UX do formulário
- [ ] Validações específicas por tipo
- [ ] Auto-complete de fornecedores/clientes
- [ ] Testar novos campos

**Status**: ⚠️ PARCIALMENTE COMPLETO

---

### ❌ Importação de Lançamentos em Lote (CSV)
**Tempo Estimado**: 15-20h

#### 1. Funcionalidade de Upload (8-10h)
- [ ] Adicionar botão "Importar Lançamentos" em Títulos
- [ ] Criar modal `ImportCSVModal`
- [ ] Implementar drag & drop para upload
- [ ] Validar extensão do arquivo (.csv)
- [ ] Botão para download de template CSV
- [ ] Gerar template com colunas corretas
- [ ] Componente de preview dos dados
- [ ] Tabela mostrando primeiras linhas
- [ ] Validação visual (ícones de check/erro)
- [ ] Contador de linhas válidas/inválidas
- [ ] Botão "Confirmar Importação"
- [ ] Barra de progresso durante importação

#### 2. Parser e Validação (7-10h)
- [ ] Instalar biblioteca de parsing CSV
- [ ] Função `parseCSV(file)`
- [ ] Mapear colunas obrigatórias
  - [ ] descrição
  - [ ] fornecedor_cliente
  - [ ] valor
  - [ ] data_vencimento
  - [ ] tipo (pagar/receber)
- [ ] Validar cada linha
  - [ ] Campos obrigatórios preenchidos
  - [ ] Formato de data correto
  - [ ] Valor numérico válido
  - [ ] Tipo válido
- [ ] Função `validarLinha(dados, numeroLinha)`
- [ ] Coletar erros por linha
- [ ] Checar duplicatas no próprio CSV
- [ ] Checar duplicatas no banco
- [ ] Função `inserirEmLote(titulos)`
- [ ] Tratamento de erros robusto
- [ ] Relatório de importação
  - [ ] Total de linhas
  - [ ] Importadas com sucesso
  - [ ] Linhas com erro
  - [ ] Detalhes dos erros

**Status**: ❌ NÃO INICIADO

---

### ❌ Tela de Relatórios
**Tempo Estimado**: 8-10h

- [ ] Criar arquivo `app/(tabs)/reports.tsx`
- [ ] Layout com `AnimatedBackground`
- [ ] Header com título "Relatórios"
- [ ] Seletor de tipo de relatório
  - [ ] Opção: Conciliado vs Não Conciliado
  - [ ] Opção: Fluxo de Caixa Realizado
  - [ ] Opção: Análise de Vencimentos
- [ ] Filtros globais
  - [ ] Período (data início/fim)
  - [ ] Conta bancária
  - [ ] Empresa (usar contexto)
- [ ] Botões de ação
  - [ ] Gerar Relatório
  - [ ] Exportar CSV
  - [ ] Exportar PDF
- [ ] Loading state durante geração
- [ ] Área de visualização do relatório
- [ ] Mensagem quando nenhum relatório gerado

**Status**: ❌ NÃO INICIADO

---

### ❌ Relatório: Extrato Conciliado vs Não Conciliado
**Tempo Estimado**: 8-10h

- [ ] Componente `ReconciliationReport`
- [ ] Cards de resumo no topo
  - [ ] Total de Transações
  - [ ] Total Conciliado (valor e %)
  - [ ] Total Não Conciliado (valor e %)
- [ ] Gráfico de barra ou pizza
  - [ ] Conciliado vs Não Conciliado
  - [ ] Usar biblioteca de gráficos (Victory Native ou similar)
- [ ] Tabela de transações
  - [ ] Colunas: Data, Descrição, Valor, Status, Ação
  - [ ] Badge de status colorido
  - [ ] Filtro inline por status
- [ ] Agrupamento por período
  - [ ] Opção: Diário
  - [ ] Opção: Semanal
  - [ ] Opção: Mensal
- [ ] Função `gerarRelatorioReconciliacao(filtros)`
  - [ ] Query no Supabase com joins
  - [ ] Calcular totalizadores
  - [ ] Agrupar dados
- [ ] Função `exportarCSV(dados)`
- [ ] Função `exportarPDF(dados)`

**Status**: ❌ NÃO INICIADO

---

### ❌ Relatório: Fluxo de Caixa Realizado
**Tempo Estimado**: 9-12h

- [ ] Componente `CashFlowReport`
- [ ] Cards de resumo
  - [ ] Total Entradas
  - [ ] Total Saídas
  - [ ] Saldo Líquido
  - [ ] Variação % vs período anterior
- [ ] Gráfico de linha temporal
  - [ ] Eixo X: Períodos
  - [ ] Eixo Y: Valores
  - [ ] Linha: Entradas (verde)
  - [ ] Linha: Saídas (vermelho)
  - [ ] Linha: Saldo acumulado (azul)
- [ ] Tabela detalhada por período
  - [ ] Colunas: Período, Entradas, Saídas, Saldo
  - [ ] Linha de totais no rodapé
  - [ ] Expandir para ver transações do período
- [ ] Seletor de agrupamento
  - [ ] Diário
  - [ ] Semanal
  - [ ] Mensal
- [ ] Função `gerarFluxoCaixa(filtros, agrupamento)`
  - [ ] Query otimizada
  - [ ] Calcular por período
  - [ ] Calcular saldo acumulado
- [ ] Comparação com período anterior
  - [ ] Checkbox "Comparar com período anterior"
  - [ ] Mostrar variação %
  - [ ] Gráfico comparativo
- [ ] Drill-down em período
  - [ ] Clicar no período para ver detalhes
  - [ ] Modal com transações do período

**Status**: ❌ NÃO INICIADO

---

### ❌ Seletor de Contexto Empresarial (Dashboard)
**Tempo Estimado**: 6-8h

- [ ] Criar contexto `CompanyContext`
  - [ ] Estado `selectedCompany`
  - [ ] Estado `companies`
  - [ ] Função `setSelectedCompany`
  - [ ] Função `loadCompanies`
  - [ ] Persistir em AsyncStorage
  - [ ] Restaurar ao iniciar app
- [ ] Criar componente `CompanySelector`
  - [ ] Botão no header
  - [ ] Ícone de prédio
  - [ ] Nome da empresa selecionada
  - [ ] Chevron down
- [ ] Modal de seleção
  - [ ] Lista de empresas
  - [ ] Campo de busca
  - [ ] Card por empresa
  - [ ] Checkmark na selecionada
  - [ ] Ao selecionar, fechar modal
- [ ] Adicionar no header de todas as telas
- [ ] Atualizar queries para filtrar por empresa
  - [ ] Dashboard
  - [ ] Transações
  - [ ] Títulos
  - [ ] Contas
  - [ ] Conciliação
  - [ ] Relatórios

**Status**: ❌ NÃO INICIADO

---

### ❌ Cards de Status de Conciliação no Dashboard
**Tempo Estimado**: 6-7h

- [ ] Atualizar `app/(tabs)/index.tsx` (Dashboard)
- [ ] Adicionar query para buscar dados de conciliação
  - [ ] Dias em aberto (maior diferença entre vencimento e hoje)
  - [ ] Valor desconciliado total
  - [ ] Quantidade de lançamentos pendentes
- [ ] Criar card "Dias em Aberto"
  - [ ] Ícone de calendário
  - [ ] Valor numérico grande
  - [ ] Descrição
  - [ ] Link para Conciliação
- [ ] Criar card "Valor Desconciliado"
  - [ ] Ícone de cifrão
  - [ ] Valor formatado (R$)
  - [ ] Descrição
  - [ ] Link para Conciliação
- [ ] Criar card "Lançamentos Pendentes"
  - [ ] Ícone de lista
  - [ ] Contador
  - [ ] Descrição
  - [ ] Link para Conciliação
- [ ] Integrar com dados reais
- [ ] Loading states
- [ ] Refresh ao pull down

**Status**: ❌ NÃO INICIADO

---

## 📋 SPRINT 4 – MULTIUSUÁRIOS E REFINAMENTOS

### ✅ Permissões Básicas (COMPLETO)
- [x] Admin, Analista, Viewer implementados
- [x] Proteção de rotas
- [x] Gerenciamento de usuários
- [x] RLS configurado

**Status**: ✅ 100% COMPLETO

---

### ❌ Associação de Usuários a Grupos/Empresas
**Tempo Estimado**: 10-12h

#### 1. Modelo de Dados (3-4h)
- [ ] Criar tabela `usuario_empresa`
  - [ ] Campos: id, usuario_id, empresa_id
  - [ ] Unique constraint (usuario_id, empresa_id)
- [ ] Criar tabela `grupos_empresariais`
  - [ ] Campos: id, nome, descricao, empresa_telos_id
- [ ] Criar tabela `empresa_grupo`
  - [ ] Campos: id, empresa_id, grupo_id
- [ ] Configurar RLS
- [ ] Migrar dados existentes
- [ ] Atualizar políticas de acesso

#### 2. Tela de Gerenciamento (7-8h)
- [ ] Adicionar botão "Gerenciar Empresas" em Usuários
- [ ] Criar modal `ManageUserCompaniesModal`
- [ ] Buscar empresas do usuário
- [ ] Buscar todas as empresas disponíveis
- [ ] Checklist de empresas
  - [ ] Checkbox por empresa
  - [ ] Marcar empresas já associadas
- [ ] Função `associarEmpresa(usuarioId, empresaId)`
- [ ] Função `desassociarEmpresa(usuarioId, empresaId)`
- [ ] Validação: Admin tem acesso a tudo
- [ ] Botão "Salvar" no modal
- [ ] Toast de confirmação
- [ ] Visualizar empresas do usuário na lista principal

**Status**: ❌ NÃO INICIADO

---

### ⚠️ Ajustes de Usabilidade
**Tempo Estimado**: 8-10h

#### 1. Rolagem Independente (1-2h)
- [x] Já funciona na maioria das telas
- [ ] Verificar tela de Conciliação (duas colunas)
- [ ] Ajustar se necessário

#### 2. Atalhos de Teclado (3-4h)
- [ ] Instalar biblioteca de atalhos (web)
- [ ] Implementar atalhos globais
  - [ ] Ctrl+N: Novo lançamento
  - [ ] Ctrl+F: Busca
  - [ ] Ctrl+E: Exportar
  - [ ] ESC: Fechar modal
  - [ ] Enter: Salvar formulário
- [ ] Documentar atalhos
- [ ] Adicionar tooltip com atalhos nos botões

#### 3. Melhorias de Performance (4-5h)
- [ ] Implementar paginação em listas longas
  - [ ] Transações
  - [ ] Títulos
  - [ ] Empresas
  - [ ] Logs
- [ ] Virtual scrolling em FlatLists
- [ ] Lazy loading de dados
- [ ] Otimizar queries Supabase
  - [ ] Usar select apenas campos necessários
  - [ ] Adicionar indices faltantes
- [ ] Debounce em campos de busca
- [ ] Memoização de componentes pesados

**Status**: ⚠️ PARCIALMENTE COMPLETO

---

### ❌ Exportação CSV/PDF
**Tempo Estimado**: 12-15h

#### 1. Exportação CSV (4-5h)
- [ ] Instalar biblioteca CSV
- [ ] Função utilitária `exportToCSV(data, filename)`
- [ ] Implementar em tela de Transações
- [ ] Implementar em tela de Títulos
- [ ] Implementar em tela de Empresas
- [ ] Implementar em tela de Conciliação
- [ ] Implementar em Relatórios
- [ ] Incluir filtros aplicados no CSV
- [ ] Nome de arquivo com timestamp
- [ ] Toast de confirmação
- [ ] Compartilhar arquivo (mobile)

#### 2. Exportação PDF (8-10h)
- [ ] Instalar biblioteca PDF (react-pdf ou similar)
- [ ] Criar templates de PDF
  - [ ] Header com logo e nome da empresa
  - [ ] Footer com página e data
  - [ ] Estilos consistentes
- [ ] Template para Relatório de Conciliação
- [ ] Template para Fluxo de Caixa
- [ ] Template para Extrato de Transações
- [ ] Incluir gráficos nos PDFs
- [ ] Opção de orientação (retrato/paisagem)
- [ ] Função `exportToPDF(data, template, filename)`
- [ ] Implementar em todas as telas de relatório
- [ ] Preview antes de exportar (opcional)
- [ ] Toast de confirmação
- [ ] Compartilhar arquivo (mobile)

**Status**: ❌ NÃO INICIADO

---

## 🎨 MELHORIAS DE DESIGN E UX (Conforme Cliente)

### ❌ Seletor de Contexto Dedicado
**Tempo Estimado**: 6-8h
- [ ] Já coberto na Sprint 3
- [ ] Verificar se atende requisitos do cliente
- [ ] Adicionar animações de transição
- [ ] Persistência robusta

**Status**: ❌ NÃO INICIADO

---

### ❌ Menu de Perfil Completo
**Tempo Estimado**: 3-4h

- [ ] Criar componente `UserMenu`
- [ ] Avatar do usuário
  - [ ] Iniciais se sem foto
  - [ ] Foto se disponível
- [ ] Nome do usuário
- [ ] Email do usuário
- [ ] Opções do menu
  - [ ] Tela Inicial
  - [ ] Configurações
  - [ ] Logout
- [ ] Modal ou Dropdown
- [ ] Animação de abertura
- [ ] Fechar ao clicar fora
- [ ] Adicionar no header de todas as telas

**Status**: ❌ NÃO INICIADO

---

### ❌ Botão de Ações Rápidas (FAB)
**Tempo Estimado**: 6-8h

- [ ] Criar componente `FloatingActionButton`
- [ ] Posicionar: fixo, centro inferior
- [ ] Ícone: "+"
- [ ] Estilo: glassmorphism
- [ ] Menu expansível ao clicar
  - [ ] Opção: Novo Lançamento
  - [ ] Opção: Nova Transação
  - [ ] Opção: Importar Dados
  - [ ] Opção: Conciliar
- [ ] Animações suaves de abertura/fechamento
- [ ] Fechar ao selecionar opção
- [ ] Fechar ao clicar fora
- [ ] Apenas para Admin e Analista (ocultar para Viewer)
- [ ] Adicionar em telas principais
  - [ ] Dashboard
  - [ ] Transações
  - [ ] Títulos
  - [ ] Conciliação

**Status**: ❌ NÃO INICIADO

---

### ❌ Sistema de Categorias Hierárquico
**Tempo Estimado**: 15-18h

#### 1. Modelo de Dados (4-5h)
- [ ] Criar tabela `plano_contas`
  - [ ] Campos: id, codigo, nome, nivel, categoria_pai_id
  - [ ] Campo: editavel (BOOLEAN)
  - [ ] Campo: empresa_telos_id
- [ ] Popular N1 com categorias padrão
  - [ ] Receitas
  - [ ] Despesas
  - [ ] Custos
  - [ ] Investimentos
  - [ ] etc. (baseado em normas contábeis)
- [ ] Marcar N1 como editavel=false
- [ ] Configurar RLS
- [ ] Criar índices

#### 2. Tela de Gestão (6-8h)
- [ ] Criar `app/(tabs)/chart-of-accounts.tsx`
- [ ] Visualização em árvore hierárquica
  - [ ] Usar biblioteca de tree view
  - [ ] Ícone de expandir/colapsar
  - [ ] Indentação por nível
- [ ] Componente `CategoryNode`
  - [ ] Nome da categoria
  - [ ] Código
  - [ ] Nível
  - [ ] Botões de ação (se editável)
- [ ] Botão "Adicionar Subcategoria" (N2+)
- [ ] Modal de criação/edição
  - [ ] Campo: Nome
  - [ ] Campo: Código (auto ou manual)
  - [ ] Categoria pai (read-only)
  - [ ] Nível (calculado)
- [ ] Validação: não permitir editar N1
- [ ] Função `criarCategoria(dados)`
- [ ] Função `editarCategoria(id, dados)`
- [ ] Não permitir deletar se tem subcategorias

#### 3. Padronização Automática (5-6h)
- [ ] Função `detectarNivelMaisProfundo()`
- [ ] Função `padronizarNiveis()`
  - [ ] Se alguma categoria atinge N3
  - [ ] Duplicar todas N2 para N3
  - [ ] Permitir usuário editar depois
- [ ] Modal de confirmação de padronização
  - [ ] Explicar o que será feito
  - [ ] Lista de categorias que serão duplicadas
  - [ ] Botões: Cancelar / Confirmar
- [ ] Executar padronização em background
- [ ] Notificar usuário ao concluir
- [ ] Integrar com campo categoria em Transações/Títulos
  - [ ] Dropdown com categorias
  - [ ] Agrupadas por N1
  - [ ] Mostrar hierarquia

**Status**: ❌ NÃO INICIADO

---

### ❌ Notificações Toast
**Tempo Estimado**: 4-5h

- [ ] Instalar `react-native-toast-notifications`
- [ ] Configurar `ToastProvider` no _layout.tsx
- [ ] Criar utilitário `lib/utils/toast.ts`
  - [ ] Função `showToast(message, type)`
  - [ ] Tipos: success, error, warning, info
- [ ] Substituir `Alert.alert` por toasts
  - [ ] Em todas as operações de sucesso
  - [ ] Em todas as mensagens de erro
  - [ ] Em avisos não críticos
- [ ] Configurar estilos personalizados
  - [ ] Cores por tipo
  - [ ] Posicionamento: top center
  - [ ] Duração: 3s (ajustável)
  - [ ] Animação suave
- [ ] Ícones por tipo
  - [ ] Success: checkmark
  - [ ] Error: X
  - [ ] Warning: exclamação
  - [ ] Info: i

**Status**: ❌ NÃO INICIADO

---

### ❌ Melhorar Fluxo de Lançamentos
**Tempo Estimado**: 6-8h

- [ ] Simplificar formulário de Títulos
  - [ ] Apenas campos essenciais visíveis inicialmente
  - [ ] Seção "Campos Avançados" expansível
- [ ] Campos essenciais:
  - [ ] Tipo (pagar/receber)
  - [ ] Fornecedor/Cliente
  - [ ] Valor
  - [ ] Data de Vencimento
- [ ] Campos avançados (ocultos):
  - [ ] Descrição completa
  - [ ] Categoria
  - [ ] Centro de custo
  - [ ] Observações
- [ ] Validação em tempo real
  - [ ] Feedback visual imediato
  - [ ] Ícones de check/erro nos campos
- [ ] Auto-complete
  - [ ] Fornecedores/Clientes recentes
  - [ ] Categorias comuns
- [ ] Botão "Salvar como Rascunho"
  - [ ] Permitir salvar parcialmente preenchido
  - [ ] Reabrir para completar depois
- [ ] Botão "Salvar e Criar Outro"
  - [ ] Para entrada rápida de múltiplos
  - [ ] Manter alguns campos preenchidos

**Status**: ❌ NÃO INICIADO

---

## 📊 PROGRESSO GERAL

### Por Sprint:
```
Sprint 1: ████████████░░░░░░░░ 60%
Sprint 2: ░░░░░░░░░░░░░░░░░░░░  0%
Sprint 3: ████████░░░░░░░░░░░░ 40%
Sprint 4: ████████████░░░░░░░░ 60%
Design:   ████░░░░░░░░░░░░░░░░ 20%
```

### Total Geral:
**36% Completo** (base sólida implementada)

---

## 🎯 PRÓXIMAS 3 TAREFAS RECOMENDADAS

1. ⚠️ **Correção: Duplicidade de CNPJ** (3-4h) - CRÍTICO
2. ❌ **Seletor de Contexto Empresarial** (6-8h) - ALTA PRIORIDADE
3. ❌ **Sistema de Conciliação - Fase 1** (10-15h) - CORE DO NEGÓCIO

---

**Legenda**:
- [ ] Não iniciado
- [x] Concluído
- [~] Em progresso
- [!] Bloqueado

**Última atualização**: 15/01/2026
**Próxima revisão**: Após conclusão de cada sprint
