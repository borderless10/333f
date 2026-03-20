
10- Integração com `NotificationToast` existente
🔹 Verifiquei e garanti o uso do componente `components/NotificationToast.tsx` (configurado globalmente em `app/_layout.tsx`) para renderizar toasts customizados.
🔹 Objetivos: reaproveitar o UI existente e manter identidade visual; decisão: não alterar estrutura do componente, apenas usar suas props corretamente.
✔️ Benefícios:

- Coerência visual dos toasts em todo o app.
- Menor superfície de alteração — menor risco de regressão.

11- Proteções de interação adicionais no modal
🔹 Bloqueei o botão de fechar, seletores de tipo, datepicker e botões de conta enquanto `loading` estiver true, ajustando `editable` e `disabled` onde aplicável.
🔹 Objetivos: impedir ações conflitantes durante o envio; processo: adicionar verificações `if (!loading)` nos handlers e `disabled`/`editable` nos inputs.
✔️ Benefícios:

- Redução de estados inválidos por ações concorrentes.
- Comportamento mais previsível para o usuário.

15- Checklist de verificação e testes manuais
🔹 Modelei um checklist de verificação para os fluxos alterados (salvar transação: sucesso, erro, duplo clique, regressão de toasts e loading) e sugeri testes manuais no Expo.
🔹 Objetivos: validar alterações antes do deploy; decisões: testar em web/mobile e simular falhas de rede.
✔️ Benefícios:

- Redução de regressões em produção.
- Procedimento claro de QA para quem for validar.

5 - Implementação de Edição de Perfil na Tela de Usuário
🔹 Adicionei modo de edição em `app/(tabs)/user.tsx`, permitindo alterar Nome, Email e Senha (opcional) via Supabase Auth.
🔹 Incluí validações (email, nome, senha mínima) e botões Editar/Cancelar/Salvar.
✔️ Benefícios:

- 🖊️ Usuários podem atualizar dados sem intervenção do admin.
- ✔️ Melhora autonomia e reduz suporte manual.

6 - Persistência Segura via Supabase Auth
🔹 Implementei chamadas a `supabase.auth.updateUser(...)` para atualizar campos no auth, tratando respostas e erros.
🔹 Separei atualizações por tipo (nome, email, senha) e só envio alterações efetivas.
✔️ Benefícios:

- 🔐 Menor chance de operações desnecessárias ou conflitantes.
- ♻️ Evita sobrescrever dados inalterados.

7 - Tratamento de Timeout nas Operações de Perfil
🔹 Adicionei função `withTimeout` para limitar tempo de espera em operações de update (15s) e evitar loading infinito.
🔹 Garanti `finally` para limpar estado de loading mesmo em erro/timeout.
✔️ Benefícios:

- ⛔ Elimina travamentos de UI por chamadas lentas.
- 🕒 Feedback temporal claro para o usuário.

8 - Mensageria de Feedback com Toasts
🔹 Integrei notificações via `useNotification()` para sucessos, avisos e erros ao salvar perfil e nas operações críticas.
🔹 Usei toast padrão da aplicação para consistência visual.
✔️ Benefícios:

- 🔔 Usuário recebe retorno imediato das ações.
- 🎯 Padroniza comunicação de erros e sucessos no app.

9 - Correção de Salvamento (evitar "carregando para sempre")
🔹 Detectei e corrigi o problema do botão de salvar que ficava em estado carregando indefinidamente: adicionei timeout, verificação de alterações e tratamento de erros explícito.
🔹 Adicionei lógica para não chamar API se não houve alteração.
✔️ Benefícios:

- ⬆️ Maior robustez no fluxo de edição.
- 🧪 Reduz erros de usuário e chamadas desnecessárias.
