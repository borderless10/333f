# Sistema de Notificações Completo - Todas as Telas ✅

Todas as ações do usuário agora têm notificações com ícones (MaterialIcons ou IconSymbol).

---

## 📱 Notificações por Tela

### 1. **Empresas** (`companies.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Criar empresa | Success | "Empresa criada com sucesso!" | company |
| ✅ Atualizar empresa | Success | "Empresa atualizada com sucesso!" | company |
| ✅ Deletar empresa | Success | "Empresa excluída com sucesso!" | company |
| ❌ Erro ao criar/atualizar | Error | Mensagem do erro | company |
| ❌ Erro ao deletar | Error | "Não foi possível excluir a empresa" | company |
| ❌ Erro ao carregar | Error | "Não foi possível carregar as empresas" | company |
| ⚠️ Sem permissão adicionar | Warning | "Você não tem permissão para adicionar empresas" | - |
| ⚠️ Sem permissão editar | Warning | "Você não tem permissão para editar empresas" | - |
| ⚠️ Sem permissão deletar | Warning | "Você não tem permissão para deletar empresas" | - |

---

### 2. **Contas Bancárias** (`accounts.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Criar conta | Success | "Conta criada com sucesso!" | account |
| ✅ Atualizar conta | Success | "Conta atualizada com sucesso!" | account |
| ✅ Deletar conta | Success | "Conta excluída com sucesso!" | account |
| ❌ Erro ao criar/atualizar | Error | Mensagem específica do erro | account |
| ❌ Erro ao deletar | Error | "Não foi possível excluir a conta" | account |
| ❌ Erro ao carregar | Error | "Não foi possível carregar as contas" | account |

---

### 3. **Títulos a Pagar/Receber** (`titles.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Criar título | Success | "Título criado com sucesso!" | title |
| ✅ Atualizar título | Success | "Título atualizado com sucesso!" | title |
| ✅ Deletar título | Success | "Título excluído com sucesso!" | title |
| ✅ Marcar como pago | Success | "Título marcado como pago e transação criada!" | title |
| ✅ Desmarcar como pago | Success | "Título desmarcado como pago!" | title |
| ❌ Erro ao criar/atualizar | Error | Mensagem do erro | title |
| ❌ Erro ao deletar | Error | "Não foi possível excluir o título" | title |
| ❌ Erro ao marcar pago | Error | Mensagem do erro | title |
| ❌ Erro ao desmarcar | Error | "Não foi possível desmarcar" | title |
| ❌ Erro ao carregar | Error | "Não foi possível carregar os títulos" | title |
| ⚠️ Sem permissão | Warning | "Você não tem permissão para..." | - |

---

### 4. **Transações** (`transactions.tsx` + `new-transaction-modal.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Criar transação (Receita) | Success | "Receita criada com sucesso!" | transaction (verde) |
| ✅ Criar transação (Despesa) | Success | "Despesa criada com sucesso!" | transaction (vermelho) |
| ❌ Erro ao criar | Error | Mensagem do erro | - |
| ❌ Erro ao carregar | Error | "Não foi possível carregar as transações" | - |
| ❌ Validação descrição | Error | "Por favor, preencha a descrição" | - |
| ❌ Validação valor | Error | "Por favor, preencha o valor" | - |
| ❌ Validação valor inválido | Error | "Por favor, insira um valor válido maior que zero" | - |

---

### 5. **Usuários** (`users.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Criar usuário | Success | "Usuário [email] criado com sucesso!" | user (cor do role) |
| ✅ Atualizar perfil | Success | "Perfil atualizado com sucesso!" | user (cor do role) |
| ✅ Criar perfil | Success | "Perfil criado com sucesso!" | user (cor do role) |
| ✅ Deletar usuário | Success | "Usuário deletado permanentemente do sistema!" | user |
| ❌ Erro ao criar | Error | Mensagem do erro | user |
| ❌ Erro ao atualizar perfil | Error | "Não foi possível salvar o perfil" | user |
| ❌ Erro ao deletar | Error | "Não foi possível deletar o usuário" | user |
| ❌ Erro ao carregar | Error | "Não foi possível carregar os usuários" | user |
| ⚠️ Sem permissão (não admin) | Warning | "Apenas administradores podem acessar esta página" | - |
| ⚠️ Alterar próprio perfil | Warning | "Você não pode alterar seu próprio perfil" | - |
| ⚠️ Deletar própria conta | Warning | "Você não pode deletar sua própria conta" | - |

---

### 6. **Conexões Bancárias** (`bank-connections.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Conectar conta (Pluggy) | Success | "Conta conectada com sucesso!" | link |
| ✅ Importar transações | Success | "X transações importadas com sucesso!" | export |
| ✅ Importar saldo | Success | "Saldo importado com sucesso! Conta: R$ X" | account |
| ℹ️ Transações duplicadas | Info | "X transações já existem e foram ignoradas" | link |
| ℹ️ Transações com erro | Info | "X transações não puderam ser importadas" | link |
| ℹ️ Nenhuma transação nova | Info | "Nenhuma transação nova foi encontrada" | link |
| ℹ️ Nenhuma conta encontrada | Info | "Nenhuma conta encontrada para esta conexão" | link |
| ℹ️ Renovando consentimento | Info | "Renovando consentimento de [banco]..." | link |
| ℹ️ Revogando conexão | Info | "Revogando conexão com [banco]..." | link |
| ℹ️ Importando transações | Info | "Importando transações de [banco]..." | link |
| ℹ️ Importando saldo | Info | "Importando saldo de [banco]..." | link |
| ❌ Erro ao importar transações | Error | Mensagem do erro | link |
| ❌ Erro ao importar saldo | Error | Mensagem do erro | link |
| ❌ Erro ao renovar | Error | Mensagem do erro | link |
| ❌ Erro ao revogar | Error | Mensagem do erro | link |
| ❌ Conexão sem item Pluggy | Error | "Esta conexão não possui um item Pluggy vinculado" | link |

---

### 7. **Conciliação Bancária** (`reconciliation-modal.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Conciliação manual | Success | "Conciliação realizada: [transação] ↔ [título]" | reconciliation |
| ✅ Conciliação automática | Success | "Conciliação realizada: [transação] ↔ [título]" | auto_match (sparkles) |
| ℹ️ **Nenhuma sugestão (INLINE)** | **Banner azul** | **"Nenhuma sugestão encontrada. Tente conciliar manualmente..."** | **info-outline (MaterialIcons)** |
| ❌ Erro ao conciliar | Error | "Não foi possível realizar a conciliação" | - |
| ❌ Erro ao gerar matches | Error | "Erro ao gerar sugestões de matching" | - |

---

### 8. **Histórico de Conciliação** (`reconciliation-history-modal.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Desfazer conciliação | Success | "Conciliação desfeita com sucesso" | reconciliation |
| ❌ Erro ao desfazer | Error | "Não foi possível desfazer a conciliação" | - |
| ❌ Erro ao carregar histórico | Error | "Não foi possível carregar o histórico" | - |
| ❌ Tabela não encontrada | Error | "Tabela de conciliações não encontrada. Execute o script SQL de setup" | - |

---

### 9. **Importação CSV** (`csv-import-modal.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Arquivo validado | Success | "Arquivo CSV validado com sucesso!" | export |
| ✅ Importação concluída | Success | "X transações importadas com sucesso!" | export |
| ℹ️ Arquivo com erros | Info | "Arquivo carregado. X linhas com erro serão ignoradas" | export |
| ℹ️ Erros durante importação | Info | "Erros encontrados: [lista primeiros erros]..." | export |
| ℹ️ Template CSV | Info | "Template CSV: use este formato para criar seu arquivo" | export |
| ℹ️ Arquivo salvo (sem share) | Info | "Arquivo salvo em: [caminho]" | export |
| ❌ Erro ao ler arquivo | Error | "Não foi possível ler o arquivo: [erro]" | export |
| ❌ Nenhuma transação importada | Error | "Nenhuma transação foi importada. Verifique os erros" | export |

---

### 10. **Relatórios** (`reports-modal.tsx`)

| Ação | Tipo | Mensagem | Ícone |
|------|------|----------|-------|
| ✅ Relatório conciliação gerado | Success | "Relatório de conciliação gerado com sucesso!" | reconciliation |
| ✅ Relatório fluxo de caixa gerado | Success | "Relatório de fluxo de caixa gerado com sucesso!" | export |
| ✅ Exportar CSV | Success | "Relatório exportado com sucesso!" | export |
| ℹ️ Arquivo salvo (sem share) | Info | "Arquivo salvo em: [caminho]" | export |
| ❌ Erro ao gerar | Error | "Não foi possível gerar o relatório" | export |
| ❌ Erro ao exportar | Error | "Não foi possível exportar o relatório" | export |

---

## 🎨 Tipos de Ícones Usados

### IconSymbol (SF Symbols - iOS/padrão)
- ✅ `checkmark.circle.fill` - sucesso genérico
- ❌ `xmark.circle.fill` - erro genérico
- ⚠️ `exclamationmark.triangle.fill` - warning genérico
- ℹ️ `info.circle.fill` - info genérico
- ✨ `sparkles` - match automático
- 🏢 `building.columns.fill` - empresas/contas
- 🔗 `link.circle.fill` - conexões bancárias
- 📤 `square.and.arrow.up.fill` - exportação
- 👤 `person.crop.circle.fill` - usuários

### MaterialIcons (React Native)
- ℹ️ `info-outline` - aviso informativo (banner inline)
- 🔄 `compare-arrows` - sobras/faltas
- 📄 `receipt` - transações bancárias
- 📝 `description` - títulos ERP
- ✅ `check-circle` - tudo conciliado

---

## 🔔 Comportamento das Notificações

### Toast (flutuante no topo)
- **Duração padrão:** 3000ms (3 segundos)
- **Duração longa:** 4000-6000ms (informações importantes)
- **Posição:** Topo da tela (visível em qualquer tela)
- **Animação:** Slide in/out com blur e gradient

### Banner Inline (dentro da tela)
- **Onde:** Tela de Conciliação Bancária
- **Quando:** Match automático retorna 0 sugestões
- **Visual:** Card azul com ícone `info-outline` e texto explicativo
- **Fica visível até:** Usuário fazer novo match ou fechar o modal

---

## 📊 Estatísticas de Cobertura

| Tela | Ações com notificação | Observações |
|------|----------------------|-------------|
| Empresas | 100% | Todas CRUD + permissões + erros |
| Contas Bancárias | 100% | Todas CRUD + erros de carregamento |
| Títulos | 100% | CRUD + marcar pago + erros |
| Transações | 100% | Criar + validações + erros |
| Usuários | 100% | CRUD + perfis + permissões |
| Conexões Bancárias | 100% | Conectar + importar + status |
| Conciliação | 100% | Manual + auto + desfazer + aviso inline |
| CSV Import | 100% | Validar + importar + template + erros |
| Relatórios | 100% | Gerar + exportar + erros |

**Total:** ✅ **100% de cobertura** em todas as telas!

---

## 🎯 Alterações Realizadas

### Arquivos Modificados

1. ✅ `app/(tabs)/companies.tsx`
   - +3 notificações de erro (carregar, salvar)

2. ✅ `app/(tabs)/titles.tsx`
   - +3 notificações de erro (carregar, salvar)

3. ✅ `app/(tabs)/users.tsx`
   - +3 notificações de erro (carregar, criar)

4. ✅ `components/new-transaction-modal.tsx`
   - +1 notificação de sucesso (criar transação com tipo)

5. ✅ `components/csv-import-modal.tsx`
   - +useNotification hook
   - +6 notificações (validar, importar, template, erros)

6. ✅ `components/reports-modal.tsx`
   - +useNotification hook
   - +6 notificações (gerar relatórios, exportar, erros)

7. ✅ `components/reconciliation-modal.tsx`
   - +Banner inline "Nenhuma sugestão encontrada" com ícone MaterialIcons
   - +Estado `matchWasRunWithZeroSuggestions`
   - +5 estilos (noSuggestionsBanner, noSuggestionsIconWrap, etc.)
   - -Toast "Nenhuma sugestão" (substituído por banner inline)

---

## 🎨 Visual do Banner Inline (Conciliação)

```text
┌─────────────────────────────────────────────────┐
│  ⓘ  Nenhuma sugestão encontrada                │
│                                                  │
│     Tente conciliar manualmente: selecione uma │
│     transação na coluna da esquerda (Banco) e  │
│     um título na coluna da direita (ERP),      │
│     depois toque em Conciliar.                 │
└─────────────────────────────────────────────────┘
```

- **Cor:** Azul (`#3B82F6`)
- **Ícone:** `info-outline` (MaterialIcons) em círculo
- **Background:** `rgba(59, 130, 246, 0.18)` com borda azul
- **Posição:** Logo abaixo dos botões Filtro e Match Automático

---

## ✨ Diferenciais

### 1. **Ícones contextuais**
- Cada tipo de ação tem seu próprio ícone:
  - 🏢 Empresas → `company`
  - 💳 Contas → `account`
  - 📝 Títulos → `title`
  - 💰 Transações → `transaction` (verde para receita, vermelho para despesa)
  - 👤 Usuários → `user` (cor baseada no role: admin=vermelho, analista=azul, viewer=amarelo)
  - 🔗 Conexões → `link`
  - 📊 Conciliação → `reconciliation` ou `auto_match` (sparkles)
  - 📤 Exportar → `export`

### 2. **Mensagens descritivas**
- Não apenas "Sucesso" ou "Erro"
- Mensagens específicas como "Receita criada com sucesso!" ou "X transações importadas"
- Inclui detalhes relevantes (nome, quantidade, etc.)

### 3. **Feedback em tempo real**
- Loading states com mensagens (ex: "Importando transações de Nubank...")
- Progress indicators durante importação CSV
- Contadores em tempo real

### 4. **Tratamento de permissões**
- Warnings quando usuário não tem permissão
- Mensagens amigáveis e instrutivas

### 5. **Inline + Toast**
- **Toast:** Para ações rápidas e feedback geral
- **Inline:** Para avisos contextuais que precisam ficar visíveis (conciliação)

---

## 🧪 Como Testar

### Teste 1: Criar dados
1. Ir em **Empresas** → + → preencher → salvar
2. ✅ Ver toast verde: "Empresa criada com sucesso!" com ícone

### Teste 2: Erro de validação
1. Ir em **Títulos** → + → deixar valor em branco → salvar
2. ❌ Ver toast vermelho: "Por favor, preencha o valor"

### Teste 3: Importar CSV
1. Dashboard → **Importar CSV** → escolher arquivo válido
2. ✅ Ver toast: "Arquivo CSV validado com sucesso!" com ícone export
3. Clicar em **Importar**
4. ✅ Ver toast: "X transações importadas com sucesso!"

### Teste 4: Conciliação sem sugestão
1. Dashboard → **Iniciar Conciliação**
2. Clicar em **Match Automático**
3. Se não houver sugestões: ver **banner azul inline** com ícone info e instruções

### Teste 5: Importar transações Pluggy
1. **Conexões** → toque em uma conexão ativa
2. **Importar Transações**
3. ✅ Ver toast: "X transações importadas com sucesso!" com ícone export
4. Se houver duplicatas: ver info: "X transações já existem e foram ignoradas"

### Teste 6: Sem permissão
1. Login como **Viewer**
2. Tentar adicionar empresa
3. ⚠️ Ver warning: "Você não tem permissão para adicionar empresas"

---

## 📝 Checklist de Cobertura

- [x] Empresas (criar, editar, deletar, erros, permissões)
- [x] Contas (criar, editar, deletar, erros)
- [x] Títulos (criar, editar, deletar, marcar pago, erros, permissões)
- [x] Transações (criar, validações, erros)
- [x] Usuários (criar, editar perfil, deletar, erros, permissões)
- [x] Conexões Bancárias (conectar, importar transações/saldo, erros)
- [x] Conciliação (manual, automática, desfazer, sem sugestão inline)
- [x] CSV (validar, importar, template, erros)
- [x] Relatórios (gerar, exportar, erros)

---

**Status:** ✅ Sistema de notificações 100% completo  
**Total de notificações:** ~60+ cenários cobertos  
**Última atualização:** 06/02/2026
