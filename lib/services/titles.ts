import { supabase } from '../supabase';
import { criarTransacao } from './transactions';

export interface Title {
  id?: number;
  codigo_empresa: string; // user_id
  descricao?: string;
  fornecedor_cliente: string;
  valor: number;
  data_vencimento: string; // formato: YYYY-MM-DD
  data_pagamento?: string | null;
  tipo: 'pagar' | 'receber';
  status: 'pendente' | 'pago' | 'vencido';
  conta_bancaria_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TitleWithAccount extends Title {
  contas_bancarias?: {
    id: number;
    descricao: string;
  } | null;
}

/**
 * Calcula o status do título baseado nas datas
 */
export function calcularStatus(dataVencimento: string, dataPagamento?: string | null): 'pendente' | 'pago' | 'vencido' {
  if (dataPagamento) return 'pago';
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);
  
  if (vencimento < hoje) return 'vencido';
  
  return 'pendente';
}

export interface TitleFilters {
  tipo?: 'pagar' | 'receber';
  status?: 'pendente' | 'pago' | 'vencido';
  busca?: string;
}

/**
 * Busca títulos do usuário com filtros opcionais
 */
export async function buscarTitulos(userId: string, filters?: TitleFilters) {
  let query = supabase
    .from('titulos')
    .select(`
      *,
      contas_bancarias:conta_bancaria_id (
        id,
        descricao
      )
    `)
    .eq('codigo_empresa', userId)
    .order('data_vencimento', { ascending: false });

  // Filtro por tipo (pagar/receber)
  if (filters?.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  // Filtro por status
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  // Filtro de busca (fornecedor/cliente ou descrição)
  if (filters?.busca && filters.busca.trim() !== '') {
    const busca = filters.busca.trim();
    query = query.or(
      `fornecedor_cliente.ilike.%${busca}%,descricao.ilike.%${busca}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar títulos:', error);
    return { data: null, error };
  }

  return { data: data as TitleWithAccount[], error: null };
}

/**
 * Cria um novo título
 */
export async function criarTitulo(titulo: Omit<Title, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  // Calcula o status automaticamente
  const status = calcularStatus(titulo.data_vencimento, titulo.data_pagamento);

  const tituloComStatus = {
    ...titulo,
    status,
  };

  const { data, error } = await supabase
    .from('titulos')
    .insert([tituloComStatus])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar título:', error);
    throw error;
  }

  return data;
}

/**
 * Atualiza um título existente
 */
export async function atualizarTitulo(id: number, atualizacoes: Partial<Title>) {
  // Se mudou a data de vencimento ou pagamento, recalcula o status
  let statusAtualizado = atualizacoes.status;
  
  if (atualizacoes.data_vencimento || atualizacoes.data_pagamento !== undefined) {
    // Busca o título atual para pegar os dados
    const { data: tituloAtual } = await supabase
      .from('titulos')
      .select('data_vencimento, data_pagamento')
      .eq('id', id)
      .single();

    if (tituloAtual) {
      const dataVencimento = atualizacoes.data_vencimento || tituloAtual.data_vencimento;
      const dataPagamento = atualizacoes.data_pagamento !== undefined 
        ? atualizacoes.data_pagamento 
        : tituloAtual.data_pagamento;
      
      statusAtualizado = calcularStatus(dataVencimento, dataPagamento);
    }
  }

  const { data, error } = await supabase
    .from('titulos')
    .update({ 
      ...atualizacoes, 
      status: statusAtualizado,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar título:', error);
    throw error;
  }

  return data;
}

/**
 * Deleta um título
 */
export async function deletarTitulo(id: number) {
  const { error } = await supabase
    .from('titulos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar título:', error);
    throw error;
  }
}

/**
 * Marca um título como pago e cria transação automaticamente
 */
export async function marcarTituloComoPago(
  userId: string,
  tituloId: number,
  dataPagamento?: string,
  contaBancariaId?: number
) {
  // Busca o título
  const { data: titulo, error: erroTitulo } = await supabase
    .from('titulos')
    .select('*')
    .eq('id', tituloId)
    .single();

  if (erroTitulo || !titulo) {
    throw new Error('Título não encontrado');
  }

  // Define a data de pagamento (hoje se não fornecida)
  const dataFinal = dataPagamento || new Date().toISOString().split('T')[0];

  // Atualiza o título para status "pago"
  const { error: erroUpdate } = await supabase
    .from('titulos')
    .update({
      data_pagamento: dataFinal,
      status: 'pago',
      conta_bancaria_id: contaBancariaId || titulo.conta_bancaria_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tituloId);

  if (erroUpdate) {
    throw erroUpdate;
  }

  // Cria transação automaticamente
  const tipoTransacao = titulo.tipo === 'pagar' ? 'despesa' : 'receita';
  const categoriaTransacao = titulo.tipo === 'pagar' ? 'Títulos a Pagar' : 'Títulos a Receber';
  const descricaoTransacao = titulo.descricao || 
    `${titulo.tipo === 'pagar' ? 'Pagamento de' : 'Recebimento de'} ${titulo.fornecedor_cliente}`;

  await criarTransacao({
    codigo_empresa: userId,
    descricao: descricaoTransacao,
    valor: titulo.valor,
    data: dataFinal,
    tipo: tipoTransacao,
    categoria: categoriaTransacao,
    conta_bancaria_id: contaBancariaId || titulo.conta_bancaria_id,
  });
}

/**
 * Desmarca um título como pago (volta para pendente ou vencido)
 */
export async function desmarcarTituloComoPago(tituloId: number) {
  // Busca o título
  const { data: titulo, error: erroTitulo } = await supabase
    .from('titulos')
    .select('data_vencimento')
    .eq('id', tituloId)
    .single();

  if (erroTitulo || !titulo) {
    throw new Error('Título não encontrado');
  }

  // Calcula o novo status
  const novoStatus = calcularStatus(titulo.data_vencimento, null);

  // Atualiza o título
  const { error: erroUpdate } = await supabase
    .from('titulos')
    .update({
      data_pagamento: null,
      status: novoStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tituloId);

  if (erroUpdate) {
    throw erroUpdate;
  }

  // Nota: Não deletamos a transação criada, pois pode ser importante manter o histórico
  // Se necessário, implementar lógica para deletar a transação correspondente
}
