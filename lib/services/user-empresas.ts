/**
 * Serviço de associação entre usuários e empresas
 * Permite que um usuário tenha acesso a múltiplas empresas
 */

import { supabase } from '../supabase';
import type { UserRole } from './profiles';

export interface UserEmpresaAssociation {
  id: number;
  user_id: string;
  empresa_id: number;
  role: UserRole;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmpresaComRole {
  id: number;
  codigo_empresa: string;
  empresa_telos_id?: string; // UUID como string no TypeScript
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  ativa: boolean;
  role: UserRole; // Role do usuário nesta empresa
  associacao_ativa: boolean;
  created_at: string;
}

export interface UserEmpresaDetails {
  user_id: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

/**
 * Busca todas as empresas do usuário autenticado
 * @param incluirInativas - Se deve incluir empresas/associações inativas
 */
export async function buscarEmpresasUsuario(
  incluirInativas: boolean = false
): Promise<EmpresaComRole[]> {
  try {
    const { data, error } = await supabase.rpc('buscar_empresas_usuario', {
      p_incluir_inativas: incluirInativas,
    });

    if (error) {
      // Se a função não existe (PGRST202), lança para o CompanyContext usar fallback (buscarEmpresas por userId)
      if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
        console.warn('Função buscar_empresas_usuario não encontrada. Execute o SQL user-empresas-setup.sql');
        throw error;
      }
      console.error('Erro ao buscar empresas do usuário:', error);
      throw error;
    }

    return (data || []) as EmpresaComRole[];
  } catch (error: any) {
    // Repassa o erro para o CompanyContext decidir (fallback quando RPC não existe)
    if (error.code === 'PGRST202' || error.message?.includes('Could not find the function')) {
      throw error;
    }
    console.error('Erro ao buscar empresas do usuário:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário tem acesso a uma empresa específica
 * @param empresaId - ID da empresa a verificar
 */
export async function usuarioTemAcessoEmpresa(empresaId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('usuario_tem_acesso_empresa', {
      p_empresa_id: empresaId,
    });

    if (error) {
      console.error('Erro ao verificar acesso à empresa:', error);
      return false;
    }

    return data === true;
  } catch (error: any) {
    console.error('Erro ao verificar acesso à empresa:', error);
    return false;
  }
}

/**
 * Busca todos os usuários associados a uma empresa (apenas admins)
 * @param empresaId - ID da empresa
 */
export async function buscarUsuariosEmpresa(
  empresaId: number
): Promise<UserEmpresaDetails[]> {
  try {
    const { data, error } = await supabase.rpc('buscar_usuarios_empresa', {
      p_empresa_id: empresaId,
    });

    if (error) {
      console.error('Erro ao buscar usuários da empresa:', error);
      throw error;
    }

    return (data || []) as UserEmpresaDetails[];
  } catch (error: any) {
    console.error('Erro ao buscar usuários da empresa:', error);
    throw error;
  }
}

/**
 * Associa um usuário a uma empresa (apenas admins)
 * @param userId - UUID do usuário
 * @param empresaId - ID da empresa
 * @param role - Nível de acesso (admin, analista, viewer)
 */
export async function associarUsuarioEmpresa(
  userId: string,
  empresaId: number,
  role: UserRole = 'viewer'
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('associar_usuario_empresa', {
      p_user_id: userId,
      p_empresa_id: empresaId,
      p_role: role,
    });

    if (error) {
      console.error('Erro ao associar usuário à empresa:', error);
      throw error;
    }

    return data as number;
  } catch (error: any) {
    console.error('Erro ao associar usuário à empresa:', error);
    throw error;
  }
}

/**
 * Associa um usuário a múltiplas empresas de uma vez (apenas admins)
 * @param userId - UUID do usuário
 * @param empresaIds - IDs das empresas
 * @param role - Nível de acesso padrão (admin, analista, viewer)
 */
export async function associarUsuarioMultiplasEmpresas(
  userId: string,
  empresaIds: number[],
  role: UserRole = 'viewer'
): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  for (const empresaId of empresaIds) {
    try {
      await associarUsuarioEmpresa(userId, empresaId, role);
      success++;
    } catch (error) {
      console.error(`Erro ao associar usuário à empresa ${empresaId}:`, error);
      errors++;
    }
  }

  return { success, errors };
}

/**
 * Remove a associação entre um usuário e uma empresa (apenas admins)
 * @param userId - UUID do usuário
 * @param empresaId - ID da empresa
 */
export async function desassociarUsuarioEmpresa(
  userId: string,
  empresaId: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('desassociar_usuario_empresa', {
      p_user_id: userId,
      p_empresa_id: empresaId,
    });

    if (error) {
      console.error('Erro ao desassociar usuário da empresa:', error);
      throw error;
    }

    return data === true;
  } catch (error: any) {
    console.error('Erro ao desassociar usuário da empresa:', error);
    throw error;
  }
}

/**
 * Ativa ou desativa uma associação sem deletá-la (apenas admins)
 * @param userId - UUID do usuário
 * @param empresaId - ID da empresa
 * @param ativo - true para ativar, false para desativar
 */
export async function toggleAssociacaoUsuarioEmpresa(
  userId: string,
  empresaId: number,
  ativo: boolean
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('toggle_associacao_usuario_empresa', {
      p_user_id: userId,
      p_empresa_id: empresaId,
      p_ativo: ativo,
    });

    if (error) {
      console.error('Erro ao alterar status da associação:', error);
      throw error;
    }

    return data === true;
  } catch (error: any) {
    console.error('Erro ao alterar status da associação:', error);
    throw error;
  }
}

/**
 * Busca todas as associações de um usuário (apenas admins)
 * @param userId - UUID do usuário
 */
export async function buscarAssociacoesUsuario(
  userId: string
): Promise<UserEmpresaAssociation[]> {
  try {
    const { data, error } = await supabase
      .from('user_empresas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar associações do usuário:', error);
      throw error;
    }

    return (data || []) as UserEmpresaAssociation[];
  } catch (error: any) {
    console.error('Erro ao buscar associações do usuário:', error);
    throw error;
  }
}

/**
 * Atualiza o role de um usuário em uma empresa (apenas admins)
 * @param userId - UUID do usuário
 * @param empresaId - ID da empresa
 * @param novoRole - Novo nível de acesso
 */
export async function atualizarRoleUsuarioEmpresa(
  userId: string,
  empresaId: number,
  novoRole: UserRole
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_empresas')
      .update({ role: novoRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('empresa_id', empresaId);

    if (error) {
      console.error('Erro ao atualizar role do usuário na empresa:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Erro ao atualizar role do usuário na empresa:', error);
    throw error;
  }
}

/**
 * Sincroniza as associações de um usuário com uma lista de empresas
 * Remove empresas não presentes na lista e adiciona as novas
 * @param userId - UUID do usuário
 * @param empresaIds - IDs das empresas que o usuário deve ter acesso
 * @param role - Nível de acesso padrão para novas associações
 */
export async function sincronizarAssociacoesUsuario(
  userId: string,
  empresaIds: number[],
  role: UserRole = 'viewer'
): Promise<{ added: number; removed: number; kept: number }> {
  try {
    // Buscar associações atuais
    const associacoesAtuais = await buscarAssociacoesUsuario(userId);
    const empresasAtuais = new Set(associacoesAtuais.map(a => a.empresa_id));
    const empresasNovas = new Set(empresaIds);

    let added = 0;
    let removed = 0;
    let kept = 0;

    // Adicionar novas empresas
    for (const empresaId of empresaIds) {
      if (!empresasAtuais.has(empresaId)) {
        try {
          await associarUsuarioEmpresa(userId, empresaId, role);
          added++;
        } catch (error) {
          console.error(`Erro ao adicionar empresa ${empresaId}:`, error);
        }
      } else {
        kept++;
      }
    }

    // Remover empresas que não estão mais na lista
    for (const associacao of associacoesAtuais) {
      if (!empresasNovas.has(associacao.empresa_id)) {
        try {
          await desassociarUsuarioEmpresa(userId, associacao.empresa_id);
          removed++;
        } catch (error) {
          console.error(`Erro ao remover empresa ${associacao.empresa_id}:`, error);
        }
      }
    }

    return { added, removed, kept };
  } catch (error: any) {
    console.error('Erro ao sincronizar associações do usuário:', error);
    throw error;
  }
}
