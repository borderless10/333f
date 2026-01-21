import { createClient } from '@supabase/supabase-js';
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
 * Deleta um usuário permanentemente do sistema (incluindo de auth.users)
 * Esta função remove o usuário completamente, não apenas o perfil
 */
export async function deletarUsuarioPermanentemente(userId: string) {
  // Primeiro tenta usar a função RPC se existir
  const { data: rpcData, error: rpcError } = await supabase.rpc('deletar_usuario_permanentemente', {
    p_user_id: userId,
  });

  if (!rpcError && rpcData === true) {
    return; // Sucesso
  }

  // Se a função RPC não existir ou falhar, tenta deletar apenas o perfil
  // e informa que o usuário precisa ser deletado manualmente
  if (rpcError) {
    console.error('Erro ao deletar usuário via RPC:', rpcError);
    
    // Tenta deletar pelo menos o perfil
    await deletarPerfil(userId);
    
    // Informa que o usuário ainda existe no sistema
    throw new Error(
      'Perfil removido, mas o usuário ainda existe no sistema. ' +
      'Execute o SQL no Supabase para deletar completamente: ' +
      `DELETE FROM auth.users WHERE id = '${userId}';`
    );
  }
}

/**
 * Confirma o email de um usuário (apenas para admins)
 */
async function confirmarEmailUsuario(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('confirmar_email_usuario', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Erro ao confirmar email via RPC:', error);
      // Tenta confirmar diretamente via SQL se a RPC falhar
      // Isso pode não funcionar dependendo das permissões, mas tentamos
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('Erro ao confirmar email:', err);
    return false;
  }
}

/**
 * Cria um novo usuário e seu perfil
 * Nota: Esta função requer que o Supabase tenha uma função RPC 'criar_usuario_com_perfil'
 * que cria o usuário usando admin.createUser() e depois cria o perfil.
 * Se a função RPC não existir, tentará usar signUp (pode não funcionar se já estiver autenticado).
 */
export async function criarNovoUsuario(
  email: string,
  password: string,
  role: UserRole,
  nome?: string
) {
  // Salva a sessão atual do admin antes de criar o novo usuário
  const { data: currentSession } = await supabase.auth.getSession();
  const adminSession = currentSession?.session;
  const adminUserId = adminSession?.user?.id;

  if (!adminSession) {
    throw new Error('Você precisa estar logado como admin para criar usuários');
  }

  // Primeiro, tenta usar uma função RPC se existir
  const { data: rpcData, error: rpcError } = await supabase.rpc('criar_usuario_com_perfil', {
    p_email: email,
    p_password: password,
    p_role: role,
    p_nome: nome || null,
  });

  if (!rpcError && rpcData) {
    return { data: rpcData, error: null };
  }

  // Cria um cliente Supabase SEPARADO apenas para criar o usuário
  // Isso evita que a sessão do admin seja afetada
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }
  
  const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  let novoUserId: string | null = null;
  
  try {
    // Usa o cliente temporário para criar o usuário (não afeta a sessão do admin)
    const { data: signUpData, error: signUpError } = await tempSupabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: {
          nome: nome || null,
        },
      },
    });

    if (signUpError) {
      console.error('Erro ao criar usuário:', signUpError);
      throw new Error(signUpError.message || 'Não foi possível criar o usuário');
    }

    if (!signUpData.user) {
      throw new Error('Usuário não foi criado');
    }

    novoUserId = signUpData.user.id;

    // IMPORTANTE: Restaura a sessão do admin IMEDIATAMENTE após criar o usuário
    // ANTES de fazer qualquer outra operação para evitar que o onAuthStateChange
    // altere a sessão para o novo usuário
    if (adminSession) {
      // Força a restauração imediata da sessão do admin múltiplas vezes
      // para garantir que o onAuthStateChange não altere para o novo usuário
      let sessaoRestaurada = false;
      
      try {
        for (let i = 0; i < 3; i++) {
          const { error: restoreError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
          
          if (restoreError) {
            console.warn(`Tentativa ${i + 1} de restaurar sessão falhou:`, restoreError);
          }
          
          // Aguarda um pouco para garantir que a sessão foi processada
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Verifica se a sessão foi restaurada corretamente
          const { data: verifySession } = await supabase.auth.getSession();
          if (verifySession?.session?.user?.id === adminUserId) {
            // Sessão restaurada com sucesso
            sessaoRestaurada = true;
            break;
          }
          
          // Aguarda um pouco entre tentativas (exceto na última)
          if (i < 2) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        // Se não conseguiu restaurar, tenta mais uma vez após um delay maior
        if (!sessaoRestaurada) {
          await new Promise(resolve => setTimeout(resolve, 300));
          const { error: finalError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
          
          if (finalError) {
            console.error('Erro na tentativa final de restaurar sessão:', finalError);
          }
        }
      } catch (restoreErr: any) {
        // Não lança erro aqui, apenas loga
        // O usuário foi criado com sucesso, apenas a sessão pode não ter sido restaurada
        console.error('Erro ao restaurar sessão do admin:', restoreErr);
      }
    }

    // Cria o perfil usando o cliente principal (agora com sessão do admin restaurada)
    let perfil;
    try {
      perfil = await criarPerfil(novoUserId, role);
    } catch (perfilError: any) {
      console.error('Erro ao criar perfil:', perfilError);
      throw new Error(
        'Usuário criado, mas não foi possível criar o perfil. ' + perfilError.message
      );
    }

    // Tenta confirmar o email automaticamente usando o cliente principal (com sessão do admin)
    const emailConfirmado = await confirmarEmailUsuario(novoUserId);
    
    // Verifica novamente que a sessão do admin está ativa após confirmar email
    if (adminSession) {
      const { data: finalVerifySession } = await supabase.auth.getSession();
      if (finalVerifySession?.session?.user?.id !== adminUserId) {
        // Se por algum motivo a sessão mudou, restaura novamente
        console.warn('Sessão do admin foi alterada após confirmar email, restaurando...');
        await supabase.auth.setSession({
          access_token: adminSession.access_token,
          refresh_token: adminSession.refresh_token,
        });
      }
    }
    
    // Retorna sucesso mesmo se o email não foi confirmado
    // O email pode ser confirmado depois ou o usuário pode fazer login se a confirmação estiver desabilitada
    return { 
      data: { 
        user: signUpData.user, 
        perfil,
        emailConfirmado // Indica se o email foi confirmado ou não
      }, 
      error: null 
    };
  } catch (error) {
    // Garante que a sessão do admin seja restaurada mesmo em caso de erro
    if (adminSession) {
      try {
        const { data: verifySession } = await supabase.auth.getSession();
        if (verifySession?.session?.user?.id !== adminUserId) {
          await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
          });
        }
      } catch (restoreError) {
        console.error('Erro ao restaurar sessão do admin após erro:', restoreError);
      }
    }
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
