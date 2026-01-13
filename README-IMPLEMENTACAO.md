    # 🚀 Sistema Financeiro - Guia de Implementação Completo

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Configuração do Supabase](#configuração-do-supabase)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Como Usar](#como-usar)
6. [Sistema de Perfis](#sistema-de-perfis)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema completo de controle financeiro desenvolvido com:
- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **TypeScript**: Tipagem completa em todo o projeto
- **Design**: Glassmorphism com tema dark moderno

---

## ✅ Funcionalidades Implementadas

### 1. **Busca e Ordenação de Transações**
- ✅ Busca em tempo real por descrição, categoria ou conta
- ✅ Ordenação por data, valor ou nome (crescente/decrescente)
- ✅ Filtros por tipo (todas/receitas/despesas)
- ✅ Estado vazio quando não há resultados
- ✅ Performance otimizada com `useMemo`

### 2. **CRUD de Empresas**
- ✅ Criar, editar, visualizar e deletar empresas
- ✅ Validação de CNPJ com algoritmo de dígitos verificadores
- ✅ Formatação automática de CNPJ, CEP e Telefone
- ✅ Validação de email
- ✅ Filtros por status (ativa/inativa) e busca por texto
- ✅ Prevenção de CNPJ duplicado
- ✅ Modal responsivo com todos os campos

### 3. **CRUD de Títulos a Pagar/Receber**
- ✅ Gestão completa de títulos (criar, editar, deletar)
- ✅ Tipos: A Pagar / A Receber
- ✅ Status automático: pendente, pago, vencido
- ✅ Marcar como pago cria transação automaticamente
- ✅ Desmarcar como pago reverte o status
- ✅ Filtros por tipo, status e busca
- ✅ Ordenação múltipla
- ✅ Badges coloridos por status
- ✅ Integração com contas bancárias

### 4. **Sistema de Perfis e Roles**
- ✅ Três perfis: Admin, Analista, Viewer
- ✅ Controle de acesso baseado em perfil
- ✅ Tela de gerenciamento de usuários (apenas admin)
- ✅ RLS configurado no Supabase
- ✅ Função RPC para buscar usuários com emails
- ✅ Proteção de rotas com `ProtectedRoute`
- ✅ Badge visual do perfil na tela de usuário
- ✅ Permissões granulares por tela

### 5. **Formatação Automática de Valores**
- ✅ Máscara de moeda brasileira (R$) em tempo real
- ✅ Utilitário `formatCurrencyInput()` e `parseCurrencyBRL()`
- ✅ Aplicado em todos os campos de valor

### 6. **Validações em Português**
- ✅ Todas as validações customizadas
- ✅ Mensagens de erro em português
- ✅ Validação de CNPJ, email, CEP
- ✅ Prevenção de duplicatas
- ✅ Limites de caracteres com contadores

### 7. **Integração Supabase Completa**
- ✅ Dados reais em todas as telas
- ✅ RLS habilitado em todas as tabelas
- ✅ Políticas de segurança configuradas
- ✅ Sincronização automática

### 8. **Tema Dark com Glassmorphism**
- ✅ Aplicado em todos os componentes
- ✅ Efeito de vidro fosco (backdrop-filter)
- ✅ Gradientes modernos
- ✅ Cores consistentes em todo o app

### 9. **Ícones Distintos**
- ✅ Dashboard: Casa
- ✅ Transações: Documento
- ✅ Contas: Cartão de crédito
- ✅ Empresas: Prédio
- ✅ Títulos: Documentos empilhados
- ✅ Usuários: Grupo de pessoas
- ✅ Perfil: Pessoa

---

## 🗄️ Configuração do Supabase

### Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a **URL** e a **anon key**

### Passo 2: Executar Scripts SQL

Execute o arquivo `scripts/supabase-setup.sql` no SQL Editor do Supabase.

Este script cria:
- ✅ Tabela `transacoes`
- ✅ Tabela `empresas`
- ✅ Tabela `titulos`
- ✅ Tabela `perfis`
- ✅ Função RPC `buscar_usuarios_com_perfis()`
- ✅ Índices para performance
- ✅ Políticas RLS em todas as tabelas

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### Passo 4: Criar Primeiro Admin

Após criar seu usuário pelo signup, execute no SQL Editor:

```sql
-- Substitua 'SEU_USER_ID' pelo ID real do seu usuário
-- Veja seu ID com: SELECT id FROM auth.users;

INSERT INTO perfis (usuario_id, role)
VALUES ('SEU_USER_ID', 'admin');
```

---

## 📁 Estrutura do Projeto

```
333f/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard
│   │   ├── transactions.tsx   # Transações (com busca e ordenação)
│   │   ├── accounts.tsx       # Contas Bancárias
│   │   ├── companies.tsx      # Empresas (com validação CNPJ)
│   │   ├── titles.tsx         # Títulos a Pagar/Receber
│   │   ├── users.tsx          # Gerenciamento de Usuários (admin only)
│   │   └── user.tsx           # Perfil do Usuário
│   ├── _layout.tsx            # Root Layout com Providers
│   └── login.tsx              # Tela de Login
├── components/
│   ├── ProtectedRoute.tsx     # Componente de proteção de rotas
│   └── ...                    # Outros componentes
├── contexts/
│   ├── AuthContext.tsx        # Contexto de autenticação
│   └── PermissionsContext.tsx # Contexto de permissões
├── lib/
│   ├── services/
│   │   ├── transactions.ts    # Serviço de transações
│   │   ├── companies.ts       # Serviço de empresas (+ validações)
│   │   ├── titles.ts          # Serviço de títulos
│   │   └── profiles.ts        # Serviço de perfis
│   ├── utils/
│   │   └── currency.ts        # Utilitários de moeda
│   ├── supabase.ts            # Cliente Supabase
│   └── contas.ts              # Serviço de contas bancárias
└── scripts/
    └── supabase-setup.sql     # Script de configuração do banco
```

---

## 🎮 Como Usar

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
# Edite o arquivo .env com suas credenciais

# Rodar o app
npm start
```

### Fluxo de Uso

1. **Faça login** com seu email/senha
2. **Configure seu primeiro admin** no Supabase (veja Passo 4 acima)
3. **Crie contas bancárias** na aba "Contas"
4. **Adicione empresas** com CNPJ válido
5. **Registre transações** vinculadas às contas
6. **Gerencie títulos** a pagar/receber
7. **Administre usuários** (apenas se for admin)

---

## 👥 Sistema de Perfis

### Perfis Disponíveis

#### 🔴 **Administrador** (Admin)
- ✅ Acesso total ao sistema
- ✅ Gerencia usuários e perfis
- ✅ Cria, edita e deleta todos os dados
- ✅ Visualiza tudo

#### 🔵 **Analista**
- ✅ Cria, edita e deleta dados
- ❌ Não gerencia usuários
- ✅ Visualiza tudo

#### 🟡 **Visualizador** (Viewer)
- ❌ Não cria, edita ou deleta
- ❌ Não gerencia usuários
- ✅ Apenas visualiza dados

### Como Atribuir Perfis

1. Faça login como **admin**
2. Acesse a aba **Usuários**
3. Clique em **"Atribuir Perfil"** ou **"Alterar Perfil"**
4. Selecione o perfil desejado
5. Clique em **Salvar**

### Proteção de Rotas

A tela de **Usuários** só aparece para admins. Outras telas mostram ou escondem botões baseado no perfil:

- **Viewer**: Apenas visualiza (sem botões de ação)
- **Analista**: Pode criar, editar e deletar
- **Admin**: Acesso total + gerencia usuários

---

## 🔧 Troubleshooting

### Erro: "Acesso negado ao listar usuários"

**Causa**: Você não é admin ou a função RPC não foi criada.

**Solução**:
1. Verifique se executou o script SQL completo
2. Confirme que seu usuário tem perfil de admin:
   ```sql
   SELECT * FROM perfis WHERE usuario_id = 'SEU_USER_ID';
   ```
3. Se não tiver, crie:
   ```sql
   INSERT INTO perfis (usuario_id, role) VALUES ('SEU_USER_ID', 'admin');
   ```

### Erro: "CNPJ inválido"

**Causa**: O CNPJ digitado não passa na validação de dígitos verificadores.

**Solução**: Use um CNPJ válido. Para testes, use:
- `11.222.333/0001-81`

Ou gere um em: [geradorcnpj.com](https://www.geradorcnpj.com/)

### Valores não formatam em R$

**Causa**: Não está usando o utilitário de formatação.

**Solução**: Verifique se está usando:
```typescript
import { formatCurrencyInput, parseCurrencyBRL } from '@/lib/utils/currency';

// Ao digitar:
<TextInput
  value={valor}
  onChangeText={(text) => setValor(formatCurrencyInput(text))}
/>

// Ao salvar:
const valorNumerico = parseCurrencyBRL(valor);
```

### RLS bloqueia todas as queries

**Causa**: Políticas RLS não configuradas corretamente.

**Solução**: Execute novamente o script `supabase-setup.sql` completo.

### Tabs não aparecem corretamente

**Causa**: Contextos não configurados no `_layout.tsx`.

**Solução**: Verifique se os providers estão na ordem correta:
```typescript
<AuthProvider>
  <PermissionsProvider>
    <ThemeProvider>
      <Stack>...</Stack>
    </ThemeProvider>
  </PermissionsProvider>
</AuthProvider>
```

---

## 📝 Checklist de Implementação

- [x] ✅ Busca e ordenação de transações
- [x] ✅ CRUD de Empresas com validação CNPJ
- [x] ✅ CRUD de Títulos a Pagar/Receber
- [x] ✅ Sistema de Perfis/Roles
- [x] ✅ Formatação automática de valores (R$)
- [x] ✅ Validações em português
- [x] ✅ Integração Supabase (transações reais)
- [x] ✅ Contadores de caracteres
- [x] ✅ Tema dark/glassmorphism
- [x] ✅ Ícones distintos no Sidebar
- [x] ✅ Badges de status coloridos
- [x] ✅ RLS em todas as tabelas
- [x] ✅ Função RPC para buscar usuários
- [x] ✅ Tela de gerenciamento de usuários (admin)
- [x] ✅ Badge de perfil na tela de usuário

---

## 🎉 Conclusão

Todas as funcionalidades foram implementadas com sucesso! O sistema está pronto para uso.

### Próximos Passos (Opcional)

- [ ] Adicionar gráficos no Dashboard
- [ ] Implementar relatórios em PDF
- [ ] Adicionar notificações push
- [ ] Criar backup automático
- [ ] Implementar dark/light mode toggle

---

## 📞 Suporte

Em caso de dúvidas:
1. Consulte este README
2. Verifique os comentários no código
3. Revise o arquivo `supabase-setup.sql`
4. Teste com dados mock primeiro

**Desenvolvido com ❤️ usando React Native, Expo e Supabase**
