import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from './themed-text';
import { GlassContainer } from './glass-container';
import { AnimatedBackground } from './animated-background';
import type { UserRole } from '@/lib/services/profiles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiresAuth?: boolean;
}

/**
 * Componente para proteger rotas baseado em perfil
 * 
 * @param children - Componente filho a ser renderizado se autorizado
 * @param requiredRole - Perfil mínimo necessário ('admin', 'analista', 'viewer')
 * @param requiresAuth - Se true, apenas verifica autenticação (padrão: true)
 */
export function ProtectedRoute({ 
  children, 
  requiredRole,
  requiresAuth = true 
}: ProtectedRouteProps) {
  const { user, userRole, loading, roleLoading } = useAuth();

  // Mostra loading enquanto verifica autenticação e perfil
  if (loading || (requiresAuth && roleLoading)) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#00b09b" />
          <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
        </View>
      </View>
    );
  }

  // Verifica se usuário está autenticado
  if (requiresAuth && !user) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.centerContent}>
          <GlassContainer style={styles.messageCard}>
            <ThemedText type="title" style={styles.errorTitle}>
              Acesso Negado
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              Você precisa estar autenticado para acessar esta página.
            </ThemedText>
          </GlassContainer>
        </View>
      </View>
    );
  }

  // Verifica se possui perfil requerido
  if (requiredRole && !userRole) {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.centerContent}>
          <GlassContainer style={styles.messageCard}>
            <ThemedText type="title" style={styles.errorTitle}>
              Sem Permissão
            </ThemedText>
            <ThemedText style={styles.errorMessage}>
              Você não possui um perfil atribuído. Entre em contato com um administrador.
            </ThemedText>
          </GlassContainer>
        </View>
      </View>
    );
  }

  // Verifica se o perfil do usuário tem acesso
  if (requiredRole) {
    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      analista: 2,
      admin: 3,
    };

    const userLevel = roleHierarchy[userRole as UserRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return (
        <View style={styles.container}>
          <AnimatedBackground />
          <View style={styles.centerContent}>
            <GlassContainer style={styles.messageCard}>
              <ThemedText type="title" style={styles.errorTitle}>
                Acesso Negado
              </ThemedText>
              <ThemedText style={styles.errorMessage}>
                Você não tem permissão para acessar esta página.
              </ThemedText>
              <ThemedText style={styles.errorSubMessage}>
                Seu perfil: {getRoleNamePT(userRole as UserRole)}
              </ThemedText>
              <ThemedText style={styles.errorSubMessage}>
                Perfil necessário: {getRoleNamePT(requiredRole)}
              </ThemedText>
            </GlassContainer>
          </View>
        </View>
      );
    }
  }

  // Se passou por todas as verificações, renderiza o componente
  return <>{children}</>;
}

function getRoleNamePT(role: UserRole): string {
  const names: Record<UserRole, string> = {
    admin: 'Administrador',
    analista: 'Analista',
    viewer: 'Visualizador',
  };
  return names[role];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  messageCard: {
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  errorTitle: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorSubMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
});
