1- Implementação do Sidebar e redução das Tabs
🔹 Implementamos um Sidebar lateral e reduzimos a navegação inferior para três abas primárias (Home, Gerenciar Usuários, Perfil).
🔹 Decidimos manter telas secundárias acessíveis pelo menu lateral para priorizar foco móvel e clareza de navegação.
🔹 Processo: introduzimos um `SidebarContext` para controlar abertura/fechamento e integramos o componente `AppSidebar` no layout de abas.
✔️ Benefícios:

- Navegação mais limpa e focada nas ações principais.
- Menor congestão visual na barra inferior.
- Facilidade para adicionar itens secundários sem poluir o tab bar.

2- Criação de `contexts/SidebarContext.tsx`
🔹 Criamos o contexto `SidebarContext` para gerenciar o estado do menu lateral (abrir, fechar, alternar).
🔹 Decisão: expor funções `open()`, `close()` e `toggle()` para uso em `ScreenHeader` e outros componentes.
🔹 Processo: implementação em React Context com hooks leves e tipagem TS.
✔️ Benefícios:

- Controle centralizado do estado do sidebar.
- Evita prop-drilling e facilita integrações futuras.

3- Desenvolvimento do componente `components/app-sidebar.tsx`
🔹 Implementamos o `AppSidebar` com overlay, animação de entrada e lista de rotas secundárias (Transações, Contas, Conexões, Empresas, Títulos).
🔹 Decisões de UX: incluir overlay para fechamento ao tocar fora e destacar o item ativo.
🔹 Processo: animações simples, acessibilidade básica e integração com o router do Expo.
✔️ Benefícios:

- Acesso rápido às telas secundárias sem ocupar espaço fixo.
- Experiência consistente entre telas.

4- Redesenho do layout de abas (`app/(tabs)/_layout.tsx`)
🔹 Editamos o layout de abas para envolver as telas com `SidebarProvider` e `SwipeableTabWrapper` e para expor apenas as três abas principais.
🔹 Decisão: manter as demais rotas registradas mas sem `href` para evitar indexação por abas.
🔹 Processo: reescrita limpa do arquivo e testes locais de build/linters.
✔️ Benefícios:

- Estrutura modular e fácil de manter.
- Comportamento de navegação previsível para usuários e testes.

5- Ajuste do `SwipeableTabWrapper` para novo conjunto de abas
🔹 Atualizamos o wrapper de swipe para reconhecer apenas os caminhos das três abas primárias e para desabilitar swipes enquanto o sidebar estiver aberto.
🔹 Decisão técnica: bloquear gestos conflitantes para melhorar usabilidade.
🔹 Processo: modificação das constantes de caminhos e checagem do `SidebarContext` ao tratar gestos.
✔️ Benefícios:

- Evita navegações acidentais quando o menu lateral está ativo.
- Gestos mais previsíveis e controle claro do UX.

6- Reestruturação do `ScreenHeader` 
🔹 Reestruturamos o header em duas linhas: topo com ícone do menu e ações; segunda linha com título alinhado à esquerda abaixo do hamburger.
🔹 Decisão: posicionar o hamburger fixo no canto superior esquerdo para consistência visual e usabilidade.
🔹 Processo: remover duplicidade de safe-area padding, ajustar espaçamentos e garantir responsividade em diferentes tamanhos.
✔️ Benefícios:

- Título com melhor leitura e respiro visual.
- Interface mais próxima das expectativas móveis (hamburger sempre visível).

7- Inspeção e validação da integração com Pluggy (backend)
🔹 Verificamos os arquivos de Edge Functions (`supabase/functions/*`) relacionados a Pluggy: geração de connect token, accounts, transactions e status de items.
🔹 Processo: leitura de código, revisão das chamadas, validação dos contratos HTTP usados pelo cliente.
🔹 Teste prático: execução de POST para o endpoint de connect token retornou `connectToken` e `redirectUrl`, confirmando inserção de token de redirect no DB.
✔️ Benefícios:

- Confirmação de que a integração servidor (edge functions) está operacional.
- Reduz risco de regressões ao adaptar o cliente para novo fluxo de navegação.

8- Verificação e uso de `lib/services/pluggy.ts`
🔹 Mapeamos e validamos as funções cliente: `getPluggyConnectToken`, `getPluggyConnectUrl`, `getPluggyAccounts`, `getPluggyTransactions` e `checkAndRenewPluggyItem`.
🔹 Decisão: manter uso via edge functions para segurar secrets e fluxo de redirect.
🔹 Processo: leitura, confirmação de rotas e parâmetros, ajustes mínimos de chamadas quando necessário.
✔️ Benefícios:

- Segurança: secrets permanecem server-side nas edge functions.
- Separação clara entre cliente e backend.



9- Criação de novas telas/itens no sidebar (mapeamento de rotas)
🔹 Mapeamos as rotas secundárias para o menu lateral: Transações, Contas, Conexões, Empresas, Títulos.
🔹 Processo: registrar rotas no `AppSidebar` e garantir navegação via router do Expo.
✔️ Benefícios:

- Usuários encontram facilmente recursos secundários sem poluir a barra de abas.
- Organização clara de privilégios (ex.: administradores veem Gerenciar Usuários).

11- Integração do toggle do sidebar com o header
🔹 Ligamos o botão de hamburger no `ScreenHeader` ao `SidebarContext.toggle()` para abrir/fechar o menu lateral de forma consistente.
🔹 Processo: utilização do contexto e atualização de handlers de clique/tap.
✔️ Benefícios:

- Comportamento previsível do menu em qualquer tela.
- Menos repetição de código ao acionar o menu.

13- Testes manuais rápidos de navegação e fluxo Pluggy
🔹 Executamos testes manuais para confirmar: abrir/fechar sidebar, navegar para telas secundárias a partir do menu, gerar connect token Pluggy e confirmar redirectUrl.
🔹 Processo: chamadas HTTP pontuais, navegação local via Expo Router e inspeção de console/logs.
✔️ Benefícios:

- Validação de ponta a ponta nos fluxos alterados.
- Identificação precoce de pontos a ajustar (UI/gestos).
