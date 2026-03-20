import { supabase } from "./supabase";

export interface ContaBancaria {
  id?: number;
  codigo_conta_banco: number;
  codigo_empresa: string; // UUID do usuário
  empresa_id?: number | null;
  codigo_banco: number;
  codigo_agencia: number;
  descricao: string;
  numero_conta: string;
  created_at?: string;
  updated_at?: string;
}

// CREATE - Criar nova conta
export async function criarConta(
  conta: Omit<ContaBancaria, "id" | "created_at" | "updated_at">,
) {
  const { data, error } = await supabase
    .from("contas_bancarias")
    .insert([conta])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar conta:", error);
    throw error;
  }
  return data;
}

// READ - Buscar contas do usuário e empresa selecionada
export async function buscarContas(
  codigoEmpresa: string,
  empresaId?: number | null,
) {
  // Monta query base
  let query = supabase
    .from("contas_bancarias")
    .select("*")
    .eq("codigo_empresa", codigoEmpresa)
    .order("created_at", { ascending: false });

  // Se empresaId informado, tenta filtrar; se a coluna não existir no banco,
  // faz fallback e retorna sem filtrar por empresa_id (compatibilidade retroativa)
  if (empresaId !== undefined) {
    try {
      const q =
        empresaId === null
          ? query.is("empresa_id", null)
          : query.eq("empresa_id", empresaId);

      const { data, error } = await q;
      if (error) {
        // Se coluna não existir (código Postgres 42703), faz fallback
        if (error.code === "42703") {
          console.warn(
            "Coluna empresa_id ausente no banco; retornando sem filtro de empresa.",
          );
          const { data: data2, error: error2 } = await supabase
            .from("contas_bancarias")
            .select("*")
            .eq("codigo_empresa", codigoEmpresa)
            .order("created_at", { ascending: false });
          if (error2) {
            console.error("Erro ao buscar contas (fallback):", error2);
            throw error2;
          }
          return data2 || [];
        }

        console.error("Erro ao buscar contas:", error);
        throw error;
      }
      return data || [];
    } catch (err: any) {
      // Erro vindo do driver (ex: coluna inexistente) — faz fallback
      if (
        err?.message?.includes("contas_bancarias.empresa_id") ||
        err?.code === "42703"
      ) {
        console.warn(
          "Coluna empresa_id ausente no banco; executando fallback sem filtro.",
        );
        const { data: data2, error: error2 } = await supabase
          .from("contas_bancarias")
          .select("*")
          .eq("codigo_empresa", codigoEmpresa)
          .order("created_at", { ascending: false });
        if (error2) {
          console.error("Erro ao buscar contas (fallback):", error2);
          throw error2;
        }
        return data2 || [];
      }
      console.error("Erro ao buscar contas (exceção):", err);
      throw err;
    }
  }

  // Sem empresaId — executa query normal
  const { data, error } = await query;
  if (error) {
    console.error("Erro ao buscar contas:", error);
    throw error;
  }
  return data || [];
}

// READ - Buscar uma conta específica
export async function buscarContaPorId(id: number) {
  const { data, error } = await supabase
    .from("contas_bancarias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar conta:", error);
    throw error;
  }
  return data;
}

// UPDATE - Atualizar conta garantindo isolamento por usuário/empresa
export async function atualizarConta(
  id: number,
  atualizacoes: Partial<ContaBancaria>,
  codigoEmpresa: string,
  empresaId?: number | null,
) {
  let query = supabase
    .from("contas_bancarias")
    .update({ ...atualizacoes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("codigo_empresa", codigoEmpresa);
  if (empresaId !== undefined) {
    try {
      query =
        empresaId === null
          ? query.is("empresa_id", null)
          : query.eq("empresa_id", empresaId);

      const { data, error } = await query.select().single();
      if (error) {
        if (error.code === "42703") {
          console.warn(
            "empresa_id ausente no banco; atualizando sem filtro de empresa.",
          );
          const { data: d2, error: e2 } = await supabase
            .from("contas_bancarias")
            .update({ ...atualizacoes, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("codigo_empresa", codigoEmpresa)
            .select()
            .single();
          if (e2) {
            console.error("Erro ao atualizar conta (fallback):", e2);
            throw e2;
          }
          return d2;
        }
        console.error("Erro ao atualizar conta:", error);
        throw error;
      }
      return data;
    } catch (err: any) {
      if (
        err?.message?.includes("contas_bancarias.empresa_id") ||
        err?.code === "42703"
      ) {
        console.warn(
          "empresa_id ausente no banco; atualizando sem filtro (fallback).",
        );
        const { data: d2, error: e2 } = await supabase
          .from("contas_bancarias")
          .update({ ...atualizacoes, updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("codigo_empresa", codigoEmpresa)
          .select()
          .single();
        if (e2) {
          console.error("Erro ao atualizar conta (fallback):", e2);
          throw e2;
        }
        return d2;
      }
      console.error("Erro ao atualizar conta (exceção):", err);
      throw err;
    }
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Erro ao atualizar conta:", error);
    throw error;
  }
  return data;
}

// DELETE - Deletar conta garantindo isolamento por usuário/empresa
export async function deletarConta(
  id: number,
  codigoEmpresa: string,
  empresaId?: number | null,
) {
  let query = supabase
    .from("contas_bancarias")
    .delete()
    .eq("id", id)
    .eq("codigo_empresa", codigoEmpresa);
  if (empresaId !== undefined) {
    try {
      query =
        empresaId === null
          ? query.is("empresa_id", null)
          : query.eq("empresa_id", empresaId);

      const { error } = await query;
      if (error) {
        if (error.code === "42703") {
          console.warn(
            "empresa_id ausente no banco; deletando sem filtro de empresa.",
          );
          const { error: e2 } = await supabase
            .from("contas_bancarias")
            .delete()
            .eq("id", id)
            .eq("codigo_empresa", codigoEmpresa);
          if (e2) {
            console.error("Erro ao deletar conta (fallback):", e2);
            throw e2;
          }
          return;
        }
        console.error("Erro ao deletar conta:", error);
        throw error;
      }
      return;
    } catch (err: any) {
      if (
        err?.message?.includes("contas_bancarias.empresa_id") ||
        err?.code === "42703"
      ) {
        console.warn(
          "empresa_id ausente no banco; deletando sem filtro (fallback).",
        );
        const { error: e2 } = await supabase
          .from("contas_bancarias")
          .delete()
          .eq("id", id)
          .eq("codigo_empresa", codigoEmpresa);
        if (e2) {
          console.error("Erro ao deletar conta (fallback):", e2);
          throw e2;
        }
        return;
      }
      console.error("Erro ao deletar conta (exceção):", err);
      throw err;
    }
  }

  const { error } = await query;

  if (error) {
    console.error("Erro ao deletar conta:", error);
    throw error;
  }
}
