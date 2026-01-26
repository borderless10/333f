/**
 * Flag global para ignorar mudanças de sessão durante criação de usuário
 * Isso evita que o onAuthStateChange altere a sessão do admin para o novo usuário criado
 */
let isCreatingUser = false;

export function setCreatingUserFlag(value: boolean) {
  isCreatingUser = value;
  console.log('[auth-flag] Flag isCreatingUser definida como:', value);
}

export function getCreatingUserFlag(): boolean {
  return isCreatingUser;
}
