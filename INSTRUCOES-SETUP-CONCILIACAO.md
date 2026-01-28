# Instruções para Configurar Tabela de Conciliações

## ⚠️ Erro Detectado

Se você está vendo o erro:
```
Could not find the table 'public.conciliacoes' in the schema cache
```

Isso significa que a tabela de conciliações ainda não foi criada no seu banco de dados Supabase.

## ✅ Solução

Execute o script SQL de setup da conciliação:

### Passo 1: Acesse o Supabase Dashboard
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto

### Passo 2: Abra o SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**

### Passo 3: Execute o Script
1. Abra o arquivo `scripts/reconciliation-setup.sql` neste projeto
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 4: Verifique
Após executar, você deve ver a mensagem de sucesso. Para verificar se funcionou:

```sql
SELECT * FROM conciliacoes LIMIT 1;
```

Se não houver erro, a tabela foi criada com sucesso!

## 📋 O que o Script Cria

O script cria:
- ✅ Tabela `conciliacoes` - Armazena as conciliações
- ✅ Tabela `historico_conciliacoes` - Histórico de ações
- ✅ Índices para performance
- ✅ Políticas RLS (Row Level Security)
- ✅ Triggers para atualização automática
- ✅ View `vw_conciliacoes_detalhadas`

## 🔄 Após Executar

Após executar o script:
1. Recarregue o app
2. Os erros de "tabela não encontrada" devem desaparecer
3. A funcionalidade de conciliação deve funcionar normalmente

## ⚡ Nota Importante

O app agora tem tratamento de erro melhorado. Se a tabela não existir, ele:
- Não vai travar o app
- Vai mostrar mensagens de erro amigáveis
- Vai retornar arrays vazios em vez de quebrar

Mas para usar a funcionalidade completa, você precisa executar o script SQL!
