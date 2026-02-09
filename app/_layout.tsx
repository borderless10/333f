import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { useTokenRenewal } from '@/hooks/use-token-renewal';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/NotificationToast';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Hook de renovação automática de tokens (roda globalmente quando usuário está logado)
  useTokenRenewal({
    checkInterval: 30 * 60 * 1000, // Verificar a cada 30 minutos
    autoRenew: true,
    checkOnMount: true,
  });

  useEffect(() => {
    if (loading) return; // Aguarda carregamento inicial

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Se não está autenticado e está tentando acessar tabs, redireciona para login
      router.replace('/login');
    } else if (user && !inAuthGroup) {
      // Se está autenticado e não está em tabs, redireciona para tabs
      router.replace('/(tabs)');
    }
  }, [user, segments, loading]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00152a' }}>
        <ActivityIndicator size="large" color="#00b09b" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PermissionsProvider>
            <CompanyProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </ThemeProvider>
            </CompanyProvider>
          </PermissionsProvider>
        </AuthProvider>
        <Toast config={toastConfig} topOffset={60} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
