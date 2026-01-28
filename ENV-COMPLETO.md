# 📝 Arquivo .env Completo - Configuração

## ✅ COMO DEVE FICAR SEU ARQUIVO `.env`

Crie um arquivo chamado `.env` na **raiz do projeto** (mesmo nível do `package.json`) com o seguinte conteúdo:

```env
# =====================================================
# CONFIGURAÇÃO DO SUPABASE (OBRIGATÓRIO)
# =====================================================
EXPO_PUBLIC_SUPABASE_URL=https://wqqxyupgndcpetqzudez.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcXh5dXBnbmRjcGV0cXp1ZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODkxMTIsImV4cCI6MjA3OTY2NTExMn0.QS83QorW71kDqlwH9r8NN87QOvA2XXDWpn4O-DSabzc

# =====================================================
# CONFIGURAÇÃO OPEN FINANCE - PLUGG.TO (OPCIONAL)
# =====================================================
# Descomente as linhas abaixo se você tiver conta no Plugg.to:
# EXPO_PUBLIC_PLUGG_API_KEY=sua_api_key_aqui
# EXPO_PUBLIC_PLUGG_API_SECRET=sua_api_secret_aqui
# EXPO_PUBLIC_PLUGG_BASE_URL=https://api.plugg.to

# =====================================================
# CONFIGURAÇÃO OPEN FINANCE - BELVO (OPCIONAL)
# =====================================================
# Descomente as linhas abaixo se você tiver conta no Belvo:
# EXPO_PUBLIC_BELVO_SECRET_ID=sua_secret_id_aqui
# EXPO_PUBLIC_BELVO_SECRET_PASSWORD=sua_password_aqui
# EXPO_PUBLIC_BELVO_BASE_URL=https://sandbox.belvo.com
```

---

## 📋 INSTRUÇÕES PASSO A PASSO

### **1. Criar o arquivo `.env`**

1. Na raiz do projeto (mesmo nível do `package.json`)
2. Crie um novo arquivo chamado `.env` (sem extensão, apenas `.env`)
3. Cole o conteúdo acima

### **2. Configurar Supabase (OBRIGATÓRIO)**

As variáveis do Supabase já estão preenchidas com suas informações:
- ✅ `EXPO_PUBLIC_SUPABASE_URL` - Sua URL
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Sua chave anônima

**Não precisa alterar nada aqui!**

### **3. Configurar Open Finance (OPCIONAL)**

Você tem 3 opções:

#### **Opção A: Modo Manual (Recomendado para começar)**
- **Não faça nada!** Deixe as variáveis comentadas
- O sistema funcionará em modo simulado
- Você pode testar todas as funcionalidades
- Depois pode integrar com API real

#### **Opção B: Usar Plugg.to**
1. Crie conta em: https://plugg.to
2. Obtenha sua API Key e Secret
3. Descomente as linhas do Plugg.to no `.env`
4. Substitua `sua_api_key_aqui` e `sua_api_secret_aqui` pelos valores reais

#### **Opção C: Usar Belvo**
1. Crie conta em: https://belvo.com
2. Obtenha Secret ID e Password
3. Descomente as linhas do Belvo no `.env`
4. Substitua pelos valores reais

---

## ⚠️ IMPORTANTE

1. **NUNCA commite o arquivo `.env` no Git**
   - Ele já está no `.gitignore`
   - Contém informações sensíveis

2. **Reinicie o servidor após criar/alterar `.env`**
   ```bash
   # Pare o servidor (Ctrl+C)
   # Depois inicie novamente
   npx expo start
   ```

3. **Verifique se o arquivo está na raiz**
   - Deve estar no mesmo nível do `package.json`
   - Não dentro de pastas como `app/` ou `lib/`

---

## ✅ VERIFICAÇÃO

Após criar o arquivo, verifique:

1. **Arquivo existe?**
   ```bash
   # No terminal, na raiz do projeto:
   ls -la .env
   # Deve mostrar o arquivo
   ```

2. **Variáveis estão corretas?**
   - Abra o arquivo `.env`
   - Verifique se as URLs e chaves estão corretas
   - Sem espaços extras ou caracteres estranhos

3. **Servidor reconhece?**
   - Reinicie o servidor
   - Não deve aparecer erros sobre variáveis não encontradas

---

## 🎯 RESUMO RÁPIDO

**Para começar AGORA (modo manual):**
```env
EXPO_PUBLIC_SUPABASE_URL=https://wqqxyupgndcpetqzudez.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxcXh5dXBnbmRjcGV0cXp1ZGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwODkxMTIsImV4cCI6MjA3OTY2NTExMn0.QS83QorW71kDqlwH9r8NN87QOvA2XXDWpn4O-DSabzc
```

**Pronto!** Só isso já é suficiente para começar. As variáveis do Open Finance podem ser adicionadas depois.

---

## 📚 PRÓXIMOS PASSOS

1. ✅ Criar arquivo `.env` com o conteúdo acima
2. ✅ Reiniciar servidor: `npx expo start`
3. ✅ Executar script SQL (PASSO 1 do guia)
4. ✅ Testar a aplicação!

---

**Dúvidas?** Consulte `INSTRUCOES-EXECUCAO-SPRINT1.md`
