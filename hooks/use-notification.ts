import { useCallback } from "react";
import Toast from "react-native-toast-message";

export interface NotificationOptions {
  title?: string;
  message?: string;
  duration?: number;
  onPress?: () => void;
  transactionType?: "receita" | "despesa";
  iconType?:
    | "company"
    | "account"
    | "user"
    | "title"
    | "link"
    | "reconciliation"
    | "auto_match"
    | "export";
  userRole?: "admin" | "analista" | "viewer";
  icon?: string; // Ícone customizado (nome do ícone SF Symbols)
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
  const TOAST_DURATIONS = {
    QUICK: 2500,
    STANDARD: 3000,
    LONG: 4000,
  } as const;

  const showSuccess = useCallback(
    (message: string, options?: NotificationOptions) => {
      Toast.show({
        type: "success",
        text1: options?.title || undefined, // Não mostrar título padrão se não fornecido
        text2: message,
        visibilityTime: options?.duration || TOAST_DURATIONS.STANDARD,
        onPress: options?.onPress,
        props: {
          transactionType: options?.transactionType, // Passar tipo de transação através de props
          iconType: options?.iconType, // Passar tipo de ícone através de props
          userRole: options?.userRole, // Passar cargo do usuário através de props
          customIcon: options?.icon, // Passar ícone customizado através de props
        },
      } as any);
    },
    [],
  );

  const showError = useCallback(
    (message: string, options?: NotificationOptions) => {
      Toast.show({
        type: "error",
        text1: options?.title || undefined,
        text2: message,
        visibilityTime: options?.duration || TOAST_DURATIONS.LONG,
        onPress: options?.onPress,
        props: {
          iconType: options?.iconType,
          customIcon: options?.icon,
        },
      } as any);
    },
    [],
  );

  const showWarning = useCallback(
    (message: string, options?: NotificationOptions) => {
      Toast.show({
        type: "warning",
        text1: options?.title || undefined,
        text2: message,
        visibilityTime: options?.duration || 3500,
        onPress: options?.onPress,
        props: {
          iconType: options?.iconType,
          customIcon: options?.icon,
        },
      } as any);
    },
    [],
  );

  const showInfo = useCallback(
    (message: string, options?: NotificationOptions) => {
      Toast.show({
        type: "info",
        text1: options?.title || undefined,
        text2: message,
        visibilityTime: options?.duration || TOAST_DURATIONS.STANDARD,
        onPress: options?.onPress,
        props: {
          iconType: options?.iconType,
          customIcon: options?.icon,
        },
      } as any);
    },
    [],
  );

  const showTransactionSuccess = useCallback(
    (
      transactionType: "receita" | "despesa",
      options?: Omit<NotificationOptions, "transactionType">,
    ) => {
      const title = transactionType === "receita" ? "✓ Receita" : "✓ Despesa";
      showSuccess(
        `${transactionType === "receita" ? "Receita" : "Despesa"} criada com sucesso!`,
        {
          title,
          transactionType,
          iconType: "export",
          duration: options?.duration || TOAST_DURATIONS.STANDARD,
          ...options,
        } as NotificationOptions,
      );
    },
    [showSuccess],
  );

  const showTransactionError = useCallback(
    (
      message: string,
      options?: Omit<NotificationOptions, "transactionType">,
    ) => {
      showError(message, {
        title: "Erro",
        duration: options?.duration || TOAST_DURATIONS.LONG,
        ...options,
      } as NotificationOptions);
    },
    [showError],
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showTransactionSuccess,
    showTransactionError,
  };
}
