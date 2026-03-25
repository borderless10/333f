

10 - Correção do Logout para Evitar Bloqueio
🔹 No `contexts/AuthContext.tsx` apliquei logout local imediato (limpar estado) antes de tentar logout remoto no Supabase.
🔹 Implantei timeout (8s) para a chamada remota e log de fallback se falhar.
✔️ Benefícios:

- 🔓 Usuário é desconectado localmente mesmo com backend instável.
- 🧰 Evita UI travada ao clicar em Logout.
l
11 - Estabilização do Login (timeouts e background)
🔹 Alterei `signIn` no `AuthContext` para usar timeout (12s) e carregamento de role em background (não bloqueante).
🔹 Atualizei `app/login.tsx` para chamar `signIn` do contexto e tratar mensagens específicas de timeout/rede.
✔️ Benefícios:

- 🚀 Login mais resiliente em redes instáveis.
- ⏱️ Interface não fica presa aguardando carregamento de perfil.

12 - Carregamento de Perfil sem Bloqueio
🔹 Modifiquei o `onAuthStateChange` para disparar `loadUserRole(...)` assincronamente, evitando await bloqueante.
🔹 `loadUserRole` passou a ter timeout próprio para não travar a aplicação.
✔️ Benefícios:

- 📲 Melhora tempo até primeira interação pós-login.
- 🔁 Perfil atualiza em segundo plano sem impedir navegação.
