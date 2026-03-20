/**
 * Hook para renovação automática de tokens bancários expirados
 */

import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import {
  getUserConnections,
  isTokenExpired,
} from "@/lib/services/open-finance";
import { checkAndRenewPluggyItem } from "@/lib/services/pluggy";
import { useCallback, useEffect, useRef } from "react";
import { useNotification } from "./use-notification";

interface UseTokenRenewalOptions {
  /**
   * Intervalo de verificação em milissegundos (padrão: 30 minutos)
   */
  checkInterval?: number;
  /**
   * Se deve renovar automaticamente ou apenas notificar (padrão: true)
   */
  autoRenew?: boolean;
  /**
   * Se deve executar verificação ao montar o componente (padrão: true)
   */
  checkOnMount?: boolean;
}

/**
 * Hook que verifica e renova automaticamente tokens expirados
 *
 * @example
 * ```tsx
 * // No componente raiz ou em _layout.tsx
 * useTokenRenewal({
 *   checkInterval: 30 * 60 * 1000, // 30 minutos
 *   autoRenew: true,
 *   checkOnMount: true,
 * });
 * ```
 */
export function useTokenRenewal(options: UseTokenRenewalOptions = {}) {
  const {
    checkInterval = 30 * 60 * 1000, // 30 minutos padrão
    autoRenew = true,
    checkOnMount = true,
  } = options;

  const { userId } = useAuth();
  const { selectedCompany } = useCompany();
  const { showInfo, showWarning, showSuccess } = useNotification();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCheckingRef = useRef(false);

  const checkExpiredTokens = useCallback(async () => {
    if (!userId || isCheckingRef.current) return;

    try {
      isCheckingRef.current = true;

      // Buscar todas as conexões do usuário
      const connections = await getUserConnections(
        userId,
        selectedCompany?.id ?? null,
      );

      // Filtrar conexões ativas com tokens expirados
      const expiredConnections = connections.filter(
        (conn) =>
          conn.status === "active" &&
          conn.pluggy_item_id &&
          isTokenExpired(conn.expires_at),
      );

      if (expiredConnections.length === 0) {
        return; // Nenhum token expirado
      }

      console.log(
        `🔄 Encontradas ${expiredConnections.length} conexões com tokens expirados`,
      );

      // Processar cada conexão expirada
      for (const connection of expiredConnections) {
        try {
          if (autoRenew && connection.pluggy_item_id) {
            // Tentar renovar automaticamente via Pluggy
            const result = await checkAndRenewPluggyItem(
              connection.pluggy_item_id,
            );

            if (result.renewed) {
              showSuccess(`Conexão renovada automaticamente`, {
                title: connection.bank_name,
                iconType: "link",
                duration: 4000,
              });
            } else if (result.needsUserAction) {
              // Requer ação do usuário (relogin)
              showWarning(`Requer reconexão manual`, {
                title: connection.bank_name,
                iconType: "link",
                duration: 5000,
              });
            }
          } else {
            // Apenas notificar (sem renovação automática)
            showInfo(`Token expirado. Renove o consentimento.`, {
              title: connection.bank_name,
              iconType: "link",
              duration: 5000,
            });
          }
        } catch (error: any) {
          console.error(
            `Erro ao renovar token de ${connection.bank_name}:`,
            error,
          );
        }
      }
    } catch (error: any) {
      console.error("Erro ao verificar tokens expirados:", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [userId, selectedCompany, autoRenew, showInfo, showWarning, showSuccess]);

  // Iniciar verificação periódica
  useEffect(() => {
    if (!userId) {
      // Limpar intervalo se não há usuário
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verificar imediatamente ao montar (se habilitado)
    if (checkOnMount) {
      checkExpiredTokens();
    }

    // Configurar verificação periódica
    intervalRef.current = setInterval(() => {
      checkExpiredTokens();
    }, checkInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [userId, checkInterval, checkOnMount, checkExpiredTokens]);

  // Retornar função para verificação manual
  return {
    checkNow: checkExpiredTokens,
  };
}
