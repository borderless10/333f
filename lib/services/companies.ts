import { supabase } from '../supabase';

export interface Company {
  id?: number;
  codigo_empresa: string; // user_id
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  ativa: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Valida CNPJ usando algoritmo de dígitos verificadores
 */
export function validarCNPJ(cnpj: string): boolean {
  // Remove formatação
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

  // Verifica se tem 14 dígitos
  if (cnpjLimpo.length !== 14) return false;

  // Verifica se todos os dígitos são iguais (caso inválido)
  if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  let peso = 5;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  if (digito1 !== parseInt(cnpjLimpo.charAt(12))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  peso = 6;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cnpjLimpo.charAt(i)) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

  return digito2 === parseInt(cnpjLimpo.charAt(13));
}

/**
 * Formata CNPJ para padrão brasileiro: 00.000.000/0000-00
 */
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) return cnpj;

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Remove formatação do CNPJ
 */
export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/[^\d]/g, '');
}

/**
 * Formata CEP para padrão brasileiro: 00000-000
 */
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/[^\d]/g, '');
  
  if (cepLimpo.length !== 8) return cep;

  return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formata telefone para padrão brasileiro: (00) 00000-0000
 */
export function formatarTelefone(telefone: string): string {
  const telefoneLimpo = telefone.replace(/[^\d]/g, '');
  
  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  }
  
  if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  return telefone;
}

/**
 * Valida formato de email
 */
export function validarEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export interface CompanyFilters {
  ativa?: boolean;
  busca?: string;
}

/**
 * Busca empresas do usuário com filtros opcionais
 */
export async function buscarEmpresas(userId: string, filters?: CompanyFilters) {
  let query = supabase
    .from('empresas')
    .select('*')
    .eq('codigo_empresa', userId)
    .order('created_at', { ascending: false });

  // Filtro por status ativo/inativo
  if (filters?.ativa !== undefined) {
    query = query.eq('ativa', filters.ativa);
  }

  // Filtro de busca (razão social, nome fantasia ou CNPJ)
  if (filters?.busca && filters.busca.trim() !== '') {
    const busca = filters.busca.trim();
    query = query.or(
      `razao_social.ilike.%${busca}%,nome_fantasia.ilike.%${busca}%,cnpj.ilike.%${busca}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar empresas:', error);
    return { data: null, error };
  }

  return { data: data as Company[], error: null };
}

/**
 * Cria uma nova empresa
 */
export async function criarEmpresa(empresa: Omit<Company, 'id' | 'created_at' | 'updated_at'>) {
  // Valida CNPJ
  if (!validarCNPJ(empresa.cnpj)) {
    throw new Error('CNPJ inválido');
  }

  // Valida email se preenchido
  if (empresa.email && !validarEmail(empresa.email)) {
    throw new Error('Email inválido');
  }

  // Remove formatação do CNPJ para salvar no banco
  const empresaParaSalvar = {
    ...empresa,
    cnpj: limparCNPJ(empresa.cnpj),
  };

  const { data, error } = await supabase
    .from('empresas')
    .insert([empresaParaSalvar])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar empresa:', error);
    
    // Mensagem específica para CNPJ duplicado
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('Este CNPJ já está cadastrado');
    }
    
    throw error;
  }

  return data;
}

/**
 * Atualiza uma empresa existente
 */
export async function atualizarEmpresa(id: number, atualizacoes: Partial<Company>) {
  // Valida CNPJ se fornecido
  if (atualizacoes.cnpj && !validarCNPJ(atualizacoes.cnpj)) {
    throw new Error('CNPJ inválido');
  }

  // Valida email se fornecido
  if (atualizacoes.email && !validarEmail(atualizacoes.email)) {
    throw new Error('Email inválido');
  }

  // Remove formatação do CNPJ se fornecido
  const empresaAtualizada = { ...atualizacoes };
  if (empresaAtualizada.cnpj) {
    empresaAtualizada.cnpj = limparCNPJ(empresaAtualizada.cnpj);
  }

  const { data, error } = await supabase
    .from('empresas')
    .update({ ...empresaAtualizada, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar empresa:', error);
    
    // Mensagem específica para CNPJ duplicado
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      throw new Error('Este CNPJ já está cadastrado');
    }
    
    throw error;
  }

  return data;
}

/**
 * Deleta uma empresa
 */
export async function deletarEmpresa(id: number) {
  const { error } = await supabase
    .from('empresas')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar empresa:', error);
    throw error;
  }
}
