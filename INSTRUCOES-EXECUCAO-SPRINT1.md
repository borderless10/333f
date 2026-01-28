# 🚀 Instruções de Execução - Sprint 1

## ✅ O QUE JÁ FOI IMPLEMENTADO

1. ✅ **Script SQL** (`scripts/open-finance-setup.sql`)
   - Tabelas `bank_connections` e `integration_logs`
   - Políticas RLS
   - Funções auxiliares

2. ✅ **Serviços** (`lib/services/open-finance.ts`)
   - Todas as funções de integração
   - Sistema de logs
   - Gerenciamento de conexões

3. ✅ **Componentes UI**
   - `app/(tabs)/bank-connections.tsx` - Tela principal
   - `components/new-connection-modal.tsx` - Modal de nova conexão
   - `components/integration-logs-modal.tsx` - Modal de logs

4. ✅ **Navegação atualizada**
   - Tab "Conexões" adicionada ao menu

---

## 📋 PASSO A PASSO PARA EXECUTAR

### **PASSO 1: Executar Script SQL** (5 minutos)

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo `scripts/open-finance-setup.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Aguarde a execução (deve aparecer "Success")

**Verificar se funcionou:**
```sql
-- Execute no SQL Editor:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('bank_connections', 'integration_logs');
```

Deve retornar 2 linhas.

---

### **PASSO 2: Configurar Variáveis de Ambiente** (10 minutos)

1. Na raiz do projeto, abra ou crie o arquivo `.env`
2. Adicione as seguintes variáveis:

```env
# Supabase (já deve existir)
EXPO_PUBLIC_SUPABASE_URL=sua_url_aqui
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui

# Open Finance - Escolha UM provedor:

# Opção 1: Plugg.to
EXPO_PUBLIC_PLUGG_API_KEY=sua_api_key_aqui
EXPO_PUBLIC_PLUGG_API_SECRET=sua_api_secret_aqui
EXPO_PUBLIC_PLUGG_BASE_URL=https://api.plugg.to

# Opção 2: Belvo
EXPO_PUBLIC_BELVO_SECRET_ID=sua_secret_id_aqui
EXPO_PUBLIC_BELVO_SECRET_PASSWORD=sua_password_aqui
EXPO_PUBLIC_BELVO_BASE_URL=https://sandbox.belvo.com

# Opção 3: Modo Manual (para testes sem API)
# Não precisa configurar nada, o sistema funcionará em modo manual
```

**Nota:** Se você não tem acesso a uma API ainda, pode deixar sem configurar. O sistema funcionará em modo manual (simulado).

3. **Reinicie o servidor:**
```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente
npx expo start
```

---

### **PASSO 3: Testar a Aplicação** (15 minutos)

1. **Inicie o app:**
```bash
npx expo start
```

2. **Acesse a tela de Conexões:**
   - No menu inferior, clique no ícone de "link" (Conexões)
   - Ou navegue para a tab "Conexões"

3. **Teste criar uma conexão:**
   - Clique no botão "+" (canto superior direito)
   - Selecione um banco (ex: Banco do Brasil)
   - Selecione tipo de conta (Conta Corrente)
   - Clique em "Conectar Conta"
   - **Nota:** Por enquanto, a conexão será criada mas o fluxo de autorização real precisa ser implementado com a API

4. **Teste importar transações:**
   - Na lista de conexões, clique em "Importar Transações"
   - **Nota:** Por enquanto, importa transações de exemplo (mock)

5. **Teste ver logs:**
   - Clique em "Ver Logs" em qualquer conexão
   - Veja os logs de todas as operações

---

### **PASSO 4: Integrar com API Real** (4-6 horas - OPCIONAL)

Se você tem acesso a uma API Open Finance (Plugg.to, Belvo, etc.):

1. **Criar arquivo `lib/services/providers/plugg.ts`** (ou belvo.ts)
   - Implementar métodos conforme documentação da API
   - Ver exemplo no `GUIA-SPRINT-1.md` (PASSO 3.2)

2. **Atualizar `components/new-connection-modal.tsx`:**
   - Na função `handleCreateConnection`, chamar a API real
   - Abrir URL de autorização no navegador
   - Processar callback quando usuário autorizar

3. **Atualizar `app/(tabs)/bank-connections.tsx`:**
   - Nas funções `handleImportTransactions` e `handleImportBalance`
   - Substituir dados mock por chamadas reais à API

**Documentação útil:**
- Plugg.to: https://docs.plugg.to
- Belvo: https://developers.belvo.com
- Open Banking Brasil: https://openbankingbrasil.org.br

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### ✅ **Criar Conexão**
- [x] Modal de nova conexão
- [x] Seleção de banco
- [x] Seleção de tipo de conta
- [x] Salvar no banco de dados
- [ ] Integração real com API (precisa implementar)

### ✅ **Renovar Consentimento**
- [x] Botão de renovar
- [x] Atualizar tokens no banco
- [x] Registrar log
- [ ] Integração real com API (precisa implementar)

### ✅ **Revogar Consentimento**
- [x] Botão de revogar
- [x] Atualizar status para "expired"
- [x] Registrar log
- [x] Funciona completamente

### ✅ **Importar Transações**
- [x] Botão de importar
- [x] Processar e salvar transações
- [x] Registrar log
- [ ] Integração real com API (usa dados mock por enquanto)

### ✅ **Importar Saldo**
- [x] Botão de importar saldo
- [x] Registrar log
- [ ] Integração real com API (usa dados mock por enquanto)

### ✅ **Sistema de Logs**
- [x] Tabela de logs criada
- [x] Registrar todas as operações
- [x] Tela para visualizar logs
- [x] Filtros por tipo e status
- [x] Funciona completamente

---

## 🐛 TROUBLESHOOTING

### Erro: "Tabela bank_connections não existe"
**Solução:** Execute o script SQL novamente (PASSO 1)

### Erro: "Permission denied" ao criar conexão
**Solução:** Verifique se as políticas RLS foram criadas corretamente no SQL

### Erro: "Function log_integration_operation does not exist"
**Solução:** O script SQL não foi executado completamente. Execute novamente.

### App não mostra a tab "Conexões"
**Solução:** 
1. Verifique se o arquivo `app/(tabs)/bank-connections.tsx` existe
2. Reinicie o servidor Expo
3. Limpe o cache: `npx expo start -c`

### Logs não aparecem
**Solução:**
1. Verifique se a função `log_integration_operation` foi criada no Supabase
2. Execute no SQL Editor:
```sql
SELECT * FROM integration_logs LIMIT 5;
```

---

## ✅ CHECKLIST FINAL

Antes de considerar completo, verifique:

- [ ] Script SQL executado com sucesso
- [ ] Tabelas `bank_connections` e `integration_logs` existem
- [ ] Função `log_integration_operation` existe
- [ ] Variáveis de ambiente configuradas (ou modo manual)
- [ ] App reiniciado após mudanças
- [ ] Tela de Conexões aparece no menu
- [ ] Consegue criar uma conexão
- [ ] Consegue ver logs
- [ ] Consegue importar transações (mock)
- [ ] Consegue revogar consentimento

---

## 📚 PRÓXIMOS PASSOS

Após completar o Sprint 1:

1. **Integrar com API real** (se tiver acesso)
2. **Sprint 2:** Implementar tela de conciliação
3. **Melhorias:** Adicionar renovação automática de tokens
4. **Melhorias:** Adicionar sincronização automática periódica

---

## 💡 DICAS

1. **Modo Manual:** Se não tem API ainda, o sistema funciona em modo manual para testes
2. **Logs são importantes:** Sempre verifique os logs quando algo não funcionar
3. **Teste passo a passo:** Não tente fazer tudo de uma vez
4. **Documentação:** Consulte `GUIA-SPRINT-1.md` para mais detalhes

---

**Boa sorte! 🚀**

Se tiver dúvidas, consulte:
- `GUIA-SPRINT-1.md` - Guia completo detalhado
- `ANALISE-IMPLEMENTACAO.md` - Análise geral do projeto
