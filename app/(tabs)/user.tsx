import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function UserScreen() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    // Buscar usuário atual
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 Usuário carregado:', user?.email);
        setUser(user);
      } catch (error) {
        console.error('❌ Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    console.log('🚪 Iniciando logout...');
    setLogoutLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Erro ao fazer logout:', error.message);
        setLogoutLoading(false);
        return;
      }

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

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
          disabled={logoutLoading || loading}
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
