# 🔧 CORREÇÃO: Incompatibilidade Node.js com Expo

## ⚠️ PROBLEMA IDENTIFICADO

**Versão Atual do Node**: v24.12.0  
**Versão do Expo**: 54.0.16  
**Problema**: Node v24 é muito novo e causa incompatibilidades com Expo/React Native

**Sintoma**: Aplicativo não funciona no Expo para Android

---

## ✅ SOLUÇÃO: Downgrade para Node LTS

### Versões Recomendadas (Escolha UMA):

| Versão | Status | Recomendação |
|--------|--------|--------------|
| **Node v20.x LTS** | ✅ Recomendado | Melhor compatibilidade com Expo 54 |
| **Node v18.x LTS** | ✅ Estável | Também funciona bem |
| Node v24.x | ❌ Muito novo | Problemas com Expo/RN |
| Node v16.x | ⚠️ EOL | Descontinuado, evitar |

---

## 🚀 MÉTODO 1: Usar NVM (Recomendado)

### Para Windows:

#### 1️⃣ Instalar NVM para Windows:
1. Desinstalar Node.js atual:
   - Painel de Controle > Programas > Desinstalar
   - Procurar "Node.js" e desinstalar

2. Baixar NVM para Windows:
   - Acesse: https://github.com/coreybutler/nvm-windows/releases
   - Baixe: `nvm-setup.exe` (latest release)
   - Execute o instalador

3. Reiniciar terminal/PowerShell

#### 2️⃣ Instalar Node v20 LTS:
```powershell
# Verificar se NVM está instalado
nvm version

# Listar versões disponíveis
nvm list available

# Instalar Node v20 LTS (mais recente)
nvm install 20

# Usar Node v20
nvm use 20

# Verificar versão
node --version
# Deve mostrar: v20.x.x
```

#### 3️⃣ Reinstalar dependências:
```powershell
# Navegar para pasta do projeto
cd "C:\Users\ferna\OneDrive\Área de Trabalho\Borderless\333f"

# Limpar instalação anterior
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Reinstalar com Node v20
npm install

# Limpar cache do Expo
npx expo start -c
```

---

## 🚀 MÉTODO 2: Reinstalar Node Diretamente

### Sem usar NVM:

#### 1️⃣ Desinstalar Node Atual:
1. Painel de Controle > Programas
2. Desinstalar "Node.js"
3. Reiniciar computador

#### 2️⃣ Instalar Node v20 LTS:
1. Acesse: https://nodejs.org/
2. Baixe: **v20.x.x LTS** (botão verde à esquerda)
3. Execute o instalador
4. Reiniciar terminal

#### 3️⃣ Verificar instalação:
```powershell
node --version
# Deve mostrar: v20.x.x

npm --version
# Deve mostrar: 10.x.x
```

#### 4️⃣ Reinstalar dependências do projeto:
```powershell
cd "C:\Users\ferna\OneDrive\Área de Trabalho\Borderless\333f"

# Limpar
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# Reinstalar
npm install

# Limpar cache Expo
npx expo start -c
```

---

## 🧪 TESTAR APÓS CORREÇÃO

### 1. Verificar versão:
```powershell
node --version
# Esperado: v20.x.x (não v24)

npm --version
# Esperado: 10.x.x
```

### 2. Iniciar Expo:
```powershell
cd "C:\Users\ferna\OneDrive\Área de Trabalho\Borderless\333f"

npm start
# ou
npx expo start
```

### 3. No Android:
1. Abrir app Expo Go no celular
2. Escanear QR code
3. Aguardar carregar
4. Fazer login
5. **Deve funcionar!** ✅

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "Cannot find module"
```powershell
# Solução: Reinstalar node_modules
Remove-Item node_modules -Recurse -Force
npm install
```

### Problema 2: "Port 8081 in use"
```powershell
# Solução: Aceitar outra porta ou matar processo
# Aceite usar porta 8082, 8083, etc quando perguntar
```

### Problema 3: "Metro bundler failed"
```powershell
# Solução: Limpar cache completo
npx expo start -c --clear
```

### Problema 4: "Android build failed"
```powershell
# Solução 1: Atualizar Expo Go no celular
# Vá na Play Store > Expo Go > Atualizar

# Solução 2: Limpar tudo
npx expo start -c --reset-cache
```

---

## 📋 CHECKLIST DE CORREÇÃO

### Downgrade do Node:
- [ ] Desinstalar Node v24
- [ ] Instalar Node v20 LTS (ou usar NVM)
- [ ] Verificar versão: `node --version` = v20.x.x
- [ ] Reiniciar terminal

### Limpar Projeto:
- [ ] Deletar pasta `node_modules`
- [ ] Deletar `package-lock.json`
- [ ] Executar `npm install`
- [ ] Aguardar instalação completa
- [ ] Sem erros

### Testar:
- [ ] Executar `npm start`
- [ ] QR code aparece
- [ ] Escanear no Expo Go (Android)
- [ ] App carrega sem erros
- [ ] Login funciona
- [ ] Dashboard aparece
- [ ] Navegação funciona

---

## 🎯 VERSÕES RECOMENDADAS

### ✅ Stack Recomendado:

| Ferramenta | Versão Recomendada | Sua Versão |
|------------|-------------------|------------|
| **Node.js** | v20.18.0 LTS | ❌ v24.12.0 |
| **NPM** | 10.x.x | ✅ 11.6.2 |
| **Expo CLI** | 54.x | ✅ 54.0.16 |
| **React** | 19.1.0 | ✅ 19.1.0 |
| **React Native** | 0.81.5 | ✅ 0.81.5 |

**Apenas o Node precisa ser corrigido!**

---

## 💡 POR QUE NODE V24 NÃO FUNCIONA?

1. **Muito novo**: Lançado recentemente, ainda em teste
2. **Breaking changes**: Mudanças que quebram compatibilidade
3. **Expo não testado**: Expo foi testado com Node 18/20
4. **Bibliotecas nativas**: Muitas libs não suportam v24 ainda

**Solução**: Usar Node LTS (Long Term Support)

---

## 🔄 ALTERNATIVA: Usar NVM para Gerenciar Versões

### Vantagens do NVM:
- ✅ Múltiplas versões de Node no mesmo PC
- ✅ Trocar versão facilmente
- ✅ Testar compatibilidade
- ✅ Projetos com diferentes requisitos

### Comandos Úteis:
```powershell
# Listar versões instaladas
nvm list

# Instalar versão específica
nvm install 20.18.0

# Usar versão
nvm use 20

# Verificar qual está ativa
nvm current

# Definir padrão
nvm alias default 20
```

---

## 📊 APÓS CORREÇÃO

### Você terá:
- ✅ Node v20 LTS instalado
- ✅ Compatibilidade com Expo
- ✅ App funcionando no Android
- ✅ Sem erros de build
- ✅ Performance melhorada

---

## 🚨 ERRO COMUM APÓS DOWNGRADE

### "npm WARN deprecated..."
**Isso é normal!** São avisos, não erros.

### "Peer dependency warnings"
**Também é normal!** Pode ignorar.

### "gyp ERR!"
**Solução**:
```powershell
# Instalar ferramentas de build
npm install --global windows-build-tools
```

---

## ✅ PASSO A PASSO RESUMIDO

```
1. Desinstalar Node v24
2. Baixar Node v20 LTS: https://nodejs.org/
3. Instalar Node v20
4. Reiniciar terminal
5. Verificar: node --version (deve ser v20.x.x)
6. Navegar para projeto
7. Deletar: node_modules e package-lock.json
8. Executar: npm install
9. Executar: npx expo start -c
10. Testar no Android
```

**Tempo total**: 15-20 minutos

---

## 🎯 LINKS ÚTEIS

- **Node.js LTS**: https://nodejs.org/
- **NVM Windows**: https://github.com/coreybutler/nvm-windows
- **Expo Docs**: https://docs.expo.dev/
- **Troubleshooting Expo**: https://docs.expo.dev/troubleshooting/

---

## 📞 SUPORTE

### Se ainda não funcionar após downgrade:

1. **Verificar Expo Go**:
   - Atualizar app Expo Go na Play Store
   - Versão mínima: 2.30.0

2. **Limpar cache completo**:
   ```powershell
   npm cache clean --force
   npx expo start -c --clear
   ```

3. **Verificar firewall**:
   - Permitir Node.js no firewall do Windows
   - Permitir Expo CLI

4. **Verificar rede**:
   - Celular e PC na mesma rede Wi-Fi
   - Desabilitar VPN se tiver

---

## 🎉 RESULTADO ESPERADO

### Antes (Node v24):
```
❌ Expo start → Erros
❌ App não abre no Android
❌ Metro bundler falha
❌ Builds quebrados
```

### Depois (Node v20):
```
✅ Expo start → Sem erros
✅ QR code aparece
✅ App abre no Android
✅ Metro bundler funciona
✅ Tudo carrega corretamente
```

---

**Status**: ✅ **SOLUÇÃO PRONTA**  
**Próximo passo**: Fazer downgrade do Node para v20 LTS  
**Tempo estimado**: 15-20 minutos  
**Dificuldade**: Fácil  

---

**Criado em**: 15/01/2026  
**Versão**: 1.0  
**Problema**: Node v24 incompatível com Expo  
**Solução**: Downgrade para Node v20 LTS  
