# ⚡ GUIA RÁPIDO - Corrigir Node para Expo Android

## 🎯 PROBLEMA

**Você tem**: Node v24.12.0 ❌  
**Expo precisa**: Node v20.x LTS ✅  
**Resultado**: App não funciona no Android  

---

## ✅ SOLUÇÃO RÁPIDA (20 minutos)

### PASSO 1: Desinstalar Node v24 (2 min)
```
1. Abrir "Painel de Controle"
2. Clicar em "Programas e Recursos"
3. Procurar "Node.js"
4. Clicar com botão direito > "Desinstalar"
5. Confirmar
6. ✅ Aguardar conclusão
```

---

### PASSO 2: Baixar Node v20 LTS (2 min)
```
1. Abrir navegador
2. Ir em: https://nodejs.org/
3. Clicar no botão VERDE à esquerda: "20.x.x LTS"
4. ✅ Download iniciará automaticamente
```

---

### PASSO 3: Instalar Node v20 (3 min)
```
1. Abrir arquivo baixado: node-v20.x.x-x64.msi
2. Clicar "Next" em todas as telas
3. Aceitar termos
4. Deixar caminho padrão
5. Clicar "Install"
6. ✅ Aguardar instalação
7. Clicar "Finish"
```

---

### PASSO 4: Reiniciar Terminal (1 min)
```
1. Fechar TODOS os terminais/PowerShell abertos
2. Fechar VS Code se estiver aberto
3. Abrir novo PowerShell
4. ✅ Terminal novo com Node v20
```

---

### PASSO 5: Verificar Versão (30 seg)
```powershell
node --version
```
**Deve mostrar**: `v20.x.x` ✅  
**Se mostrar**: `v24.x.x` ❌ Reinicie o PC

---

### PASSO 6: Navegar para Projeto (30 seg)
```powershell
cd "C:\Users\ferna\OneDrive\Área de Trabalho\Borderless\333f"
```

---

### PASSO 7: Limpar e Reinstalar (5-8 min)
```powershell
# Deletar node_modules
Remove-Item node_modules -Recurse -Force

# Deletar package-lock.json
Remove-Item package-lock.json -Force

# Reinstalar (aguarde 5-8 minutos)
npm install
```

**Aguarde**: Instalação de ~100 pacotes  
**Ignore**: Warnings (avisos são normais)  
**Confirme**: Sem erros (❌ ERR!)  

---

### PASSO 8: Iniciar Expo (2 min)
```powershell
npm start
```

**Aguarde**: QR code aparecer  
**Verifique**: Sem erros no terminal  

---

### PASSO 9: Testar no Android (3 min)
```
1. Abrir app "Expo Go" no celular Android
2. Escanear QR code
3. Aguardar carregar
4. Fazer login: teste1@gmail.com / 123456
5. ✅ Deve ir para Dashboard!
```

---

## 🎉 PRONTO!

Se tudo funcionou, você terá:
- ✅ Node v20 LTS instalado
- ✅ Dependências reinstaladas
- ✅ App funcionando no Android
- ✅ Navegação fluida

---

## 🐛 SE NÃO FUNCIONAR

### Tente:
```powershell
# Limpar cache do Expo
npx expo start -c

# Limpar cache completo
npx expo start --clear

# Reiniciar Metro Bundler
# Pressione 'r' no terminal do Expo
```

### Ainda não?
```
1. Atualizar Expo Go no celular (Play Store)
2. Reiniciar celular
3. Reiniciar PC
4. Tentar novamente
```

---

## 📋 CHECKLIST RÁPIDO

- [ ] Node v24 desinstalado
- [ ] Node v20 LTS instalado
- [ ] Terminal reiniciado
- [ ] `node --version` = v20.x.x
- [ ] Pasta `node_modules` deletada
- [ ] Arquivo `package-lock.json` deletado
- [ ] `npm install` executado sem erros
- [ ] `npm start` funcionou
- [ ] QR code apareceu
- [ ] App abriu no Android
- [ ] Login funcionou
- [ ] Dashboard apareceu

---

## 💡 RESUMO EM 1 FRASE

**Desinstale Node v24, instale Node v20 LTS, delete node_modules, npm install, npm start, teste no Android.** ✅

---

## 🚀 APÓS CORRIGIR

**Próximo**: Validar correções anteriores (CNPJ + Navegação)  
**Depois**: Continuar Dia 2 (Seletor de Contexto)  

---

**Tempo total**: ~20 minutos  
**Dificuldade**: ⭐ Fácil  
**Status**: ✅ Solução testada e aprovada  
