4- Mapeamento de requisitos para multi-tenant
🔹 Listamos todas as tabelas, serviços e telas que precisam receber `empresa_id`.
🔹 Objetivos: garantir isolamento por empresa; decisões: aplicar RLS + backfill; processo: busca por funções (`buscarContas`, `getUserConnections`, etc.).
✔️ Benefícios:

- Abrangência das mudanças garantida.
- Menor chance de vazamento de dados entre empresas.

5- Alteração de modelos e serviços (`lib/contas.ts`, `lib/services/*`)
🔹 Atualizamos assinaturas e modelos para aceitar e persistir `empresa_id` nas operações CRUD.
🔹 Objetivos: propagar contexto da empresa; decisões: exigir/propagar `empresaId` quando disponível; processo: ajustar queries e checagens.
✔️ Benefícios:

- Consistência de dados.
- Preparação do código para RLS.
- Redução de gravações sem contexto.

6- Propagação do `empresa_id` nas telas e modais (UI)
🔹 Modificamos callsites para enviar `selectedCompany?.id ?? null` em chamadas de serviço.
🔹 Objetivos: garantir que ações do usuário sejam escopadas por empresa; processo: patch em vários componentes (`accounts`, `bank-connections`, `new-transaction-modal`, etc.).
✔️ Benefícios:

- UX consistente entre seleção de empresa e dados exibidos.
- Integridade das operações assegurada.

7- Atualização da integração Open Finance (`lib/services/open-finance.ts`)
🔹 Incluímos `empresa_id` em inserts, logs e deduplicação, com fallback para ambientes antigos.
🔹 Objetivos: isolar conexões e logs por empresa; decisões: checar existência de coluna para compatibilidade; processo: alterar inserts e queries.
✔️ Benefícios:

- Rastreabilidade por empresa.
- Compatibilidade com instâncias não migradas.

8- Criação do script de migração SQL (`scripts/open-finance-multi-company-setup.sql`)
🔹 Escrevemos script idempotente que adiciona colunas, FKs, índices, backfill e políticas RLS.
🔹 Objetivos: preparar o banco para multi‑empresa; decisões: backfill usando a primeira empresa do usuário; processo: criar FKs e policies condicionais a `user_empresas`.
✔️ Benefícios:

- Deploy repetível.
- Reduz necessidade de manutenção manual.
- RLS aplicada de forma segura.

---

**Trecho relevante (RLS) — exemplo de política para seleções multi-empresa**

🔹 Este trecho demonstra a política RLS que garante que um usuário veja apenas `bank_connections` pertencentes às empresas a que está associado (`user_empresas`).

```sql
CREATE POLICY "bank_connections_select_multi_empresa"
ON public.bank_connections FOR SELECT
USING (
	auth.uid() = user_id
	AND EXISTS (
		SELECT 1
		FROM public.user_empresas ue
		WHERE ue.user_id = auth.uid()
			AND ue.empresa_id = bank_connections.empresa_id
			AND ue.ativa = true
	)
);
```
