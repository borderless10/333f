# Solução: Erro "Unable to resolve module" - Logo

## 🔍 **Análise do Problema**

O erro ocorre porque o arquivo de imagem tem **espaços ou acentos no nome**, e o bundler do React Native/Expo não consegue resolver módulos com esses caracteres especiais no `require()`.

**Erro:** `Unable to resolve module ../../assets/images/telos-control-logo.png`

**Causa raiz:** O arquivo provavelmente se chama:
- `télos control logo.png` (com espaço e acento) ❌
- `télos-control-logo.png` (com acento) ❌
- Ou outro nome com caracteres especiais

O `require()` do React Native precisa do **nome exato** do arquivo, e espaços/acentos causam problemas.

---

## ✅ **Solução Definitiva**

### **Passo 1: Renomear o arquivo**

Renomeie o arquivo para: **`telos-control-logo.png`** (sem espaços, sem acentos)

**Como fazer:**

1. **No Windows Explorer:**
   - Vá até: `assets/images/`
   - Clique com botão direito no arquivo `télos control logo.png` (ou nome atual)
   - Selecione "Renomear"
   - Digite: `telos-control-logo.png`
   - Pressione Enter

2. **Ou use o script PowerShell:**
   ```powershell
   .\scripts\rename-logo.ps1
   ```

3. **Ou via terminal:**
   ```bash
   cd assets/images
   ren "télos control logo.png" "telos-control-logo.png"
   ```

### **Passo 2: Verificar o código**

O código já está configurado para usar `telos-control-logo.png` através do arquivo `lib/assets.ts`:

```typescript
// lib/assets.ts
export const TELOS_LOGO = require('../assets/images/telos-control-logo.png');
```

E os componentes já estão usando:
```typescript
import { TELOS_LOGO } from '@/lib/assets';
// ...
<Image source={TELOS_LOGO} />
```

### **Passo 3: Limpar cache e reiniciar**

Após renomear, limpe o cache do Expo:

```bash
npx expo start --clear
```

Ou se estiver rodando:
1. Pare o servidor (Ctrl+C)
2. Execute: `npx expo start --clear`
3. Recarregue o app

---

## 🔧 **Solução Alternativa (se renomear não funcionar)**

Se mesmo após renomear o erro persistir, use `expo-image` com URI local:

```typescript
import { Image as ExpoImage } from 'expo-image';

// Em vez de require(), use:
<ExpoImage
  source={{ uri: require('../assets/images/telos-control-logo.png') }}
  style={styles.logoImage}
  contentFit="contain"
/>
```

Mas a **solução recomendada é renomear o arquivo** para não ter espaços nem acentos.

---

## 📋 **Checklist**

- [ ] Arquivo renomeado para `telos-control-logo.png` (sem espaços, sem acentos)
- [ ] Cache do Expo limpo (`npx expo start --clear`)
- [ ] App reiniciado
- [ ] Erro resolvido ✅

---

## ⚠️ **Prevenção Futura**

**Regra de ouro:** Sempre use nomes de arquivos:
- ✅ Sem espaços (use hífens ou underscores)
- ✅ Sem acentos (use ASCII simples)
- ✅ Em minúsculas (recomendado)
- ✅ Com extensão explícita (.png, .jpg, etc.)

**Exemplos bons:**
- `telos-control-logo.png` ✅
- `logo_empresa.png` ✅
- `icon-home.png` ✅

**Exemplos ruins:**
- `télos control logo.png` ❌ (espaço e acento)
- `Logo Empresa.png` ❌ (espaço e maiúscula)
- `ícone.png` ❌ (acento)
