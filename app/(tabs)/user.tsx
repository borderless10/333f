import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { getRoleName, getRoleDescription, getRoleColor } from '@/lib/services/profiles';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function UserScreen() {
  const insets = useSafeAreaInsets();
  const { user, userRole, signOut } = useAuth();
  const { canEdit, canDelete, isAdmin, isViewerOnly } = usePermissions();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    console.log('🚪 Iniciando logout...');
    setLogoutLoading(true);
    try {
      await signOut();
      console.log('✅ Logout bem-sucedido!');
      router.replace('/login');
    } catch (err) {
      console.error('💥 Erro inesperado no logout:', err);
      setLogoutLoading(false);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const userEmail = user?.email || 'Não disponível';
  const passwordMasked = '••••••••';

  const userFields = [
    { label: 'Usuário', value: userName, icon: 'person' },
    { label: 'Email', value: userEmail, icon: 'email' },
    { label: 'Senha', value: passwordMasked, icon: 'lock' },
  ];

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          Usuário
        </ThemedText>
        </View>

        {/* User Info Card com Glassmorphism */}
        <GlassContainer style={styles.glassCard}>
          <View style={styles.cardContent}>
            {userFields.map((field, index) => (
              <View key={field.label}>
                <View style={styles.fieldRow}>
                  <View style={styles.fieldLeft}>
                    <MaterialIcons 
                      name={field.icon as any} 
                      size={20} 
                      color="#00b09b" 
                      style={styles.fieldIcon}
                    />
                    <ThemedText style={styles.fieldLabel} type="defaultSemiBold">
                {field.label}
              </ThemedText>
                  </View>
                  <ThemedText style={styles.fieldValue}>
                    {field.value}
                  </ThemedText>
                </View>
                {index < userFields.length - 1 && <View style={styles.fieldDivider} />}
            </View>
          ))}
          </View>
        </GlassContainer>

        {/* Perfil e Permissões */}
        <GlassContainer style={styles.glassCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Perfil e Permissões
          </ThemedText>
          <View style={styles.cardContent}>
            {/* Perfil Atual */}
            <View style={styles.profileRow}>
              <View style={styles.fieldLeft}>
                <MaterialIcons name="badge" size={20} color="#00b09b" />
                <ThemedText style={styles.fieldLabel} type="defaultSemiBold">
                  Perfil
                </ThemedText>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: `${getRoleColor(userRole)}20` },
                ]}>
                <Text style={[styles.roleText, { color: getRoleColor(userRole) }]}>
                  {userRole ? getRoleName(userRole) : 'Sem Perfil'}
                </Text>
              </View>
            </View>

            {userRole && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.descriptionBox}>
                  <ThemedText style={styles.descriptionText}>
                    {getRoleDescription(userRole)}
                  </ThemedText>
                </View>

                <View style={styles.fieldDivider} />
                
                {/* Permissões */}
                <View style={styles.permissionsContainer}>
                  <ThemedText style={styles.permissionsTitle}>Permissões:</ThemedText>
                  <View style={styles.permissionsList}>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={isAdmin ? 'check-circle' : 'cancel'}
                        size={18}
                        color={isAdmin ? '#10B981' : '#9CA3AF'}
                      />
                      <ThemedText style={styles.permissionText}>Gerenciar usuários</ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={canEdit ? 'check-circle' : 'cancel'}
                        size={18}
                        color={canEdit ? '#10B981' : '#9CA3AF'}
                      />
                      <ThemedText style={styles.permissionText}>Criar e editar dados</ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={canDelete ? 'check-circle' : 'cancel'}
                        size={18}
                        color={canDelete ? '#10B981' : '#9CA3AF'}
                      />
                      <ThemedText style={styles.permissionText}>Deletar dados</ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons name="check-circle" size={18} color="#10B981" />
                      <ThemedText style={styles.permissionText}>Visualizar dados</ThemedText>
                    </View>
                  </View>
                </View>
              </>
            )}

            {!userRole && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.noProfileBox}>
                  <MaterialIcons name="warning" size={24} color="#FBBF24" />
                  <ThemedText style={styles.noProfileText}>
                    Você ainda não possui um perfil atribuído. Entre em contato com um administrador.
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </GlassContainer>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.8}>
          {logoutLoading ? (
            <Text style={styles.logoutButtonText}>Saindo...</Text>
          ) : (
            <>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
  },
  glassCard: {
    padding: 24,
  },
  cardContent: {
    gap: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fieldIcon: {
    // Ícone já tem tamanho definido
  },
  fieldLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
  fieldDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 16,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  descriptionBox: {
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  permissionsContainer: {
    gap: 12,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  permissionsList: {
    gap: 10,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  permissionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  noProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  noProfileText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00b09b',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
