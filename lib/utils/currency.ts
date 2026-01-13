/**
 * Formata o valor digitado em tempo real para o padrão brasileiro de moeda (R$)
 * @param value - String do valor digitado
 * @returns String formatada com R$, separador de milhar (.) e decimal (,)
 */
export function formatCurrencyInput(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se não há números, retorna R$ 0,00
  if (numbers === '') return 'R$ 0,00';
  
  // Converte para número dividindo por 100 (para considerar centavos)
  const numericValue = parseInt(numbers, 10) / 100;
  
  // Formata usando Intl.NumberFormat para padrão brasileiro
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue);
}

/**
 * Extrai o valor numérico de uma string formatada em R$
 * @param formattedValue - String formatada (ex: "R$ 1.234,56")
 * @returns Número decimal (ex: 1234.56)
 */
export function parseCurrencyBRL(formattedValue: string): number {
  // Remove tudo exceto dígitos e vírgula
  const cleaned = formattedValue.replace(/[^\d,]/g, '');
  
  // Substitui vírgula por ponto (padrão JavaScript)
  const withDot = cleaned.replace(',', '.');
  
  // Converte para float
  return parseFloat(withDot) || 0;
}

/**
 * Formata um número para exibição em reais
 * @param value - Número a ser formatado
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
