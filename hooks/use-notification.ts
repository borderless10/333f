import { useCallback } from 'react';
import Toast from 'react-native-toast-message';

export interface NotificationOptions {
  title?: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  transactionType?: 'receita' | 'despesa';
  iconType?: 'company' | 'account' | 'user' | 'title';
  userRole?: 'admin' | 'analista' | 'viewer';
}

/**
 * Hook personalizado para exibir notificações toast
 * 
 * @example
 * const { showSuccess, showError } = useNotification();
 * 
 * showSuccess('Transação criada com sucesso!');
 * showError('Não foi possível salvar', { title: 'Erro' });
 */
export function useNotification() {
  const showSuccess = useCallback((message: string, options?: NotificationOptions) => {
    Toast.show({
      type: 'success',
      text1: options?.title || undefined, // Não mostrar título padrão se não fornecido
      text2: message,
      visibilityTime: options?.duration || 3000,
      onPress: options?.onPress,
      props: {
        transactionType: options?.transactionType, // Passar tipo de transação através de props
        iconType: options?.iconType, // Passar tipo de ícone através de props
        userRole: options?.userRole, // Passar cargo do usuário através de props
      },
    } as any);
  }, []);

  const showError = useCallback((message: string, options?: NotificationOptions) => {
    Toast.show({
      type: 'error',
      text1: options?.title || undefined, // Não mostrar título padrão se não fornecido
      text2: message,
      visibilityTime: options?.duration || 4000,
      onPress: options?.onPress,
    });
  }, []);

  const showWarning = useCallback((message: string, options?: NotificationOptions) => {
    Toast.show({
      type: 'warning',
      text1: options?.title || undefined, // Não mostrar título padrão se não fornecido
      text2: message,
      visibilityTime: options?.duration || 3500,
      onPress: options?.onPress,
    });
  }, []);

  const showInfo = useCallback((message: string, options?: NotificationOptions) => {
    Toast.show({
      type: 'info',
      text1: options?.title || undefined, // Não mostrar título padrão se não fornecido
      text2: message,
      visibilityTime: options?.duration || 3000,
      onPress: options?.onPress,
    });
  }, []);

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
}
