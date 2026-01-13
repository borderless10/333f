import { supabase } from '../supabase';

export type UserRole = 'admin' | 'analista' | 'viewer';

export interface Profile {
  id?: number;
  usuario_id: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  role: UserRole | null;
  has_profile: boolean;
}

/**
 * Busca o perfil de um usuário específico
 */
export async function buscarPerfilUsuario(userId: string) {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('usuario_id', userId)
    .single();

  if (error) {
    // Se não encontrou perfil, não é erro
    if (error.code === 'PGRST116') {
      return { data: null, error: null };
    }
    console.error('Erro ao buscar perfil:', error);
    return { data: null, error };
  }

  return { data: data as Profile, error: null };
}

/**
 * Busca todos os usuários com seus perfis
 * Usa função RPC no Supabase para acessar auth.users
 */
export async function buscarUsuariosComPerfis() {
  const { data, error } = await supabase.rpc('buscar_usuarios_com_perfis');

  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return { data: null, error };
  }

  return { data: data as UserWithProfile[], error: null };
}

/**
 * Cria um novo perfil para um usuário
 */
export async function criarPerfil(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('perfis')
    .insert([{ usuario_id: userId, role }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar perfil:', error);
    
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('Este usuário já possui um perfil');
    }
    
    throw error;
  }

  return data;
}

/**
 * Atualiza o perfil de um usuário
 */
export async function atualizarPerfil(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('perfis')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('usuario_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }

  return data;
}

/**
 * Deleta o perfil de um usuário
 */
export async function deletarPerfil(userId: string) {
  const { error } = await supabase
    .from('perfis')
    .delete()
    .eq('usuario_id', userId);

  if (error) {
    console.error('Erro ao deletar perfil:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário pode editar (admin ou analista)
 */
export function canEdit(userRole: UserRole | null): boolean {
  return userRole === 'admin' || userRole === 'analista';
}

/**
 * Verifica se o usuário pode deletar (admin ou analista)
 */
export function canDelete(userRole: UserRole | null): boolean {
  return userRole === 'admin' || userRole === 'analista';
}

/**
 * Verifica se o usuário é administrador
 */
export function isAdmin(userRole: UserRole | null): boolean {
  return userRole === 'admin';
}

/**
 * Verifica se o usuário é apenas visualizador
 */
export function isViewer(userRole: UserRole | null): boolean {
  return userRole === 'viewer';
}

/**
 * Retorna a descrição do perfil em português
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: 'Acesso total ao sistema, incluindo gerenciamento de usuários',
    analista: 'Pode criar, editar e deletar dados, mas não gerencia usuários',
    viewer: 'Apenas visualização, sem permissões de edição',
  };
  
  return descriptions[role];
}

/**
 * Retorna o nome do perfil em português
 */
export function getRoleName(role: UserRole): string {
  const names: Record<UserRole, string> = {
    admin: 'Administrador',
    analista: 'Analista',
    viewer: 'Visualizador',
  };
  
  return names[role];
}

/**
 * Retorna a cor do badge do perfil
 */
export function getRoleColor(role: UserRole | null): string {
  if (!role) return '#9CA3AF'; // cinza para sem perfil
  
  const colors: Record<UserRole, string> = {
    admin: '#EF4444', // vermelho
    analista: '#3B82F6', // azul
    viewer: '#FBBF24', // amarelo
  };
  
  return colors[role];
}
