# 🔧 Solução para Carregamento Infinito

## ⚠️ Problema
O aplicativo fica carregando infinitamente e não abre.

## ✅ Soluções

### **Solução 1: Limpar Cache e Reiniciar**

1. **Pare o servidor atual**:
   - Pressione `Ctrl + C` no terminal onde o Expo está rodando
   - Ou feche o terminal

2. **Limpe o cache do Expo**:
   ```bash
   npx expo start -c
   ```

3. **Se ainda não funcionar, limpe tudo**:
   ```bash
   # Limpar cache do npm
   npm cache clean --force
   
   # Remover node_modules e reinstalar
   rm -rf node_modules
   npm install
   
   # Limpar cache do Metro Bundler
   npx expo start -c
   ```

### **Solução 2: Verificar Configuração do Supabase**

O erro geralmente ocorre quando o app tenta conectar ao Supabase mas as credenciais não estão configuradas.

1. **Verifique se o arquivo `.env` existe** na raiz do projeto

2. **Se não existir, crie** com este conteúdo:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

3. **Obtenha suas credenciais**:
   - Acesse [supabase.com](https://supabase.com)
   - Vá em Settings > API
   - Copie a **URL** e a **anon/public key**

### **Solução 3: Usar Modo Offline (Temporário)**

Se você ainda não configurou o Supabase, pode comentar temporariamente os providers:

1. **Abra `app/_layout.tsx`**

2. **Comente os Providers temporariamente**:
   ```typescript
   export default function RootLayout() {
     const colorScheme = useColorScheme();
   
     return (
       <SafeAreaProvider>
         {/* <AuthProvider> */}
         {/*   <PermissionsProvider> */}
             <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
               <Stack initialRouteName="login">
                 <Stack.Screen name="login" options={{ headerShown: false }} />
                 <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                 <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
               </Stack>
               <StatusBar style="auto" />
             </ThemeProvider>
         {/*   </PermissionsProvider> */}
         {/* </AuthProvider> */}
       </SafeAreaProvider>
     );
   }
   ```

3. **Isso permitirá que você veja o app funcionando** (mas sem autenticação)

### **Solução 4: Atualizar Pacotes do Expo**

Se os warnings sobre pacotes desatualizados estão causando problemas:

```bash
npx expo install --fix
```

## 🎯 Passo a Passo Recomendado

### **Para começar a usar o app AGORA (sem Supabase)**:

1. Pare o servidor (`Ctrl + C`)

2. Comente os providers em `app/_layout.tsx` (Solução 3 acima)

3. Limpe o cache e inicie:
   ```bash
   npx expo start -c
   ```

4. Pressione `w` para abrir no navegador

5. Você verá a tela de login (mas não conseguirá fazer login ainda)

### **Para configurar o Supabase e usar todas as funcionalidades**:

1. **Crie um projeto no Supabase**:
   - Acesse [supabase.com](https://supabase.com)
   - Clique em "New Project"
   - Escolha um nome e senha

2. **Execute o script SQL**:
   - No Supabase, vá em "SQL Editor"
   - Cole o conteúdo do arquivo `scripts/supabase-setup.sql`
   - Clique em "Run"

3. **Configure as variáveis de ambiente**:
   - Crie o arquivo `.env` na raiz
   - Adicione suas credenciais (Solução 2 acima)

4. **Descomente os providers** em `app/_layout.tsx`

5. **Reinicie o app**:
   ```bash
   npx expo start -c
   ```

## 🚨 Erros Comuns

### "Cannot pipe to a closed stream"
**Solução**: Limpe o cache com `npx expo start -c`

### "Supabase URL is not defined"
**Solução**: Configure o arquivo `.env` com suas credenciais

### "Port 8081 is being used"
**Solução**: 
- Aceite usar outra porta (8082, 8083, etc.)
- Ou mate o processo que está usando a porta

### Carregamento infinito na tela de login
**Solução**: 
- Verifique se as credenciais do Supabase estão corretas
- Ou comente os providers temporariamente (Solução 3)

## 📞 Ainda com problemas?

1. **Verifique os logs** no terminal para ver mensagens de erro específicas

2. **Tente no navegador** primeiro (pressione `w`):
   - Mais fácil para debugar
   - Mostra erros no console do navegador

3. **Verifique se todas as dependências estão instaladas**:
   ```bash
   npm install
   ```

4. **Como último recurso**, delete tudo e reinstale:
   ```bash
   rm -rf node_modules
   rm -rf .expo
   npm install
   npx expo start -c
   ```

## ✅ Checklist

- [ ] Parei o servidor anterior (Ctrl+C)
- [ ] Limpei o cache (`npx expo start -c`)
- [ ] Verifiquei se o arquivo `.env` existe
- [ ] Configurei as credenciais do Supabase OU comentei os providers
- [ ] Reiniciei o app
- [ ] Testei no navegador primeiro (pressione `w`)

---

**Dica**: Comece testando no navegador (`w`) antes de testar no celular. É mais rápido e fácil de debugar!
