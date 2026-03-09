
1- Implementação da Tela "Esqueci minha senha"

- Implementamos a tela `Esqueci minha senha` com campo de e‑mail e botão de envio (UI apenas).
  🔹 Objetivos, decisões e processos:
  - Criar interface consistente com o design existente (AnimatedBackground / GlassContainer).
  - Priorizar apenas a camada visual neste momento; a integração com Supabase será feita depois.
  - Reuso de componentes e estilos já presentes para manter consistência.
    ✔️ Benefícios:
  - Usuário tem ponto de entrada visível para recuperar senha.
  - Facilita implementação futura do envio de link de recuperação.
  - Mantém consistência visual com a aplicação.

4- Criação do Modal de excluir usuários

- Substituímos `Alert.alert` por um modal customizado ao deletar usuário em `app/(tabs)/users.tsx`.
  🔹 Objetivos, decisões e processos:
  - Criar modal com X (fechar), título, descrição e botões Cancelar/Deletar.
  - Preservar lógica de backend (chamada a `deletarUsuarioPermanentemente`) e tratamento de erro.
  - Reutilizar estilos e `AnimatedBackground` para consistência.
    ✔️ Benefícios:
  - UX consistente com outras telas.
  - Melhor controle visual e possibilidade de expansão (mais informações/aviso SQL).
  - Botão de fechar melhora usabilidade.

5- Criação do modal de excluir títulos

- Substituímos o `Alert` por modal de confirmação em `app/(tabs)/titles.tsx` para excluir títulos.
  🔹 Objetivos, decisões e processos:
  - Manter chamada a `deletarTitulo` e feedback via toasts.
  - Introduzir `titleToDelete` e estado `deleteTitleModalVisible` para controle.
    ✔️ Benefícios:
  - Consistência na experiência de confirmação.
  - Mais espaço para mensagens e explicações no fluxo de exclusão.

6- Modal para desmarcar título como pago

- Implementamos modal para confirmar a ação de desmarcar um título como pago em `titles.tsx`.
  🔹 Objetivos, decisões e processos:
  - Adicionar estado específico para unmark e handler associado.
  - Exibir mensagem clara sobre o impacto da ação.
    ✔️ Benefícios:
  - Evita ações acidentais em dados financeiros.
  - Permite mensagem explicativa, reduzindo perguntas ao suporte.

7- Modal para exclusão de empresa 

- Removemos `Alert.alert` e criamos modal customizado em `app/(tabs)/companies.tsx`.
  🔹 Objetivos, decisões e processos:
  - Adicionar estados `companyToDelete` e `deleteCompanyModalVisible`.
  - Implementar `confirmDeleteCompany()` que chama `deletarEmpresa` e exibe toasts.
  - Incluir botão de fechar (X), Cancelar e Excluir.
    ✔️ Benefícios:
  - UX uniforme com os demais modais de confirmação.
  - Possibilidade de adicionar mensagens legais/operacionais no modal.
  - Redução de prompts nativos inconsistentes.

12- Log e mensagens de debug durante carregamento

- Adicionamos logs (console) em pontos de carregamento (ex.: `loadCompanies`, `loadUsers`).
  🔹 Objetivos, decisões e processos:
  - Facilitar troubleshooting sem alterar fluxo de produção.
  - Registrar contagens e erros para diagnóstico rápido.
    ✔️ Benefícios:
  - Debug mais ágil durante testes locais.
  - Informações úteis para correção de falhas.
