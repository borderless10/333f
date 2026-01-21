import React, { useState, useEffect, useMemo } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
}

export function CurrencyInput({ value, onChangeText, ...props }: CurrencyInputProps) {
  const formatCurrency = (value: string): string => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    
    if (!numbers || numbers === '0') return 'R$ 0,00';
    
    // Converte para número e divide por 100 para ter centavos
    const amount = parseInt(numbers, 10) / 100;
    
    // Formata como moeda brasileira
    return `R$ ${amount.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calcular displayValue baseado no value atual usando useMemo
  const displayValue = useMemo(() => {
    if (!value || value === '0' || value === '') {
      return 'R$ 0,00';
    }
    
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue <= 0) {
      return 'R$ 0,00';
    }
    
    // Converter para centavos e formatar
    const cents = Math.round(numericValue * 100).toString();
    return formatCurrency(cents);
  }, [value]);

  const handleChangeText = (text: string) => {
    // Remove tudo exceto números (incluindo R$, espaços, vírgulas, pontos)
    const numbers = text.replace(/\D/g, '');
    
    if (!numbers || numbers === '0') {
      onChangeText('0');
      return;
    }
    
    // Envia o valor numérico (em reais, não centavos) para o callback
    // Divide por 100 porque estamos trabalhando com centavos na entrada
    const numericValue = (parseInt(numbers, 10) / 100).toString();
    onChangeText(numericValue);
  };

  return (
    <TextInput
      {...props}
      value={displayValue}
      onChangeText={handleChangeText}
      keyboardType="numeric"
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
  },
});
