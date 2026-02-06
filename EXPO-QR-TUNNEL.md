# Corrigir "Failed to download remote update" ao escanear o QR code

O erro **"java.io.IOException: Failed to download remote update"** no Expo Go acontece quando o celular não consegue se conectar ao servidor de desenvolvimento do seu computador (rede diferente, firewall ou roteador bloqueando).

## Solução: usar modo Tunnel

No modo **tunnel**, o Expo cria uma URL pública (via ngrok). O celular baixa o app por essa URL, sem precisar estar na mesma rede do PC.

### Passo a passo

1. **Pare** o servidor atual (Ctrl+C no terminal).

2. **Inicie com tunnel:**
   ```bash
   npm run start:tunnel
   ```
   ou:
   ```bash
   npx expo start --tunnel
   ```

3. Aguarde aparecer no terminal algo como:
   ```text
   Tunnel ready. Scan the QR code above with Expo Go (Android) ...
   ```

4. **Escaneie de novo o QR code** com o Expo Go no celular.

5. O app deve abrir e carregar normalmente (pode demorar um pouco na primeira vez).

### Se pedir instalar algo

Na primeira vez, o Expo pode pedir para instalar o pacote de tunnel (`@expo/ngrok`). Aceite ou rode:
```bash
npx expo install @expo/ngrok
```
Depois execute de novo: `npm run start:tunnel`.

---

## Alternativa: mesma rede Wi‑Fi

Se quiser usar o modo normal (sem tunnel):

- Celular e computador na **mesma rede Wi‑Fi**.
- **Firewall do Windows**: permitir conexões de entrada na porta que o Metro usa (geralmente 8081) ou desativar temporariamente para testar.
- No terminal, use `expo start` e escaneie o QR code; a URL deve usar o IP da sua máquina (ex.: `exp://192.168.x.x:8081`).

Para evitar problemas de rede, o **modo tunnel** é a opção mais estável.
