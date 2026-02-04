/**
 * Componente wrapper que detecta gestos de swipe horizontal para navegar entre abas.
 * Deslize para a esquerda = próxima aba, deslize para a direita = aba anterior.
 */

import { router, usePathname } from 'expo-router';
import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { usePermissions } from '@/contexts/PermissionsContext';

interface SwipeableTabWrapperProps {
  children: ReactNode;
}

// Ordem das abas (conforme definido em _layout.tsx)
// Usar paths relativos sem (tabs) para compatibilidade
const TAB_PATHS = [
  '/(tabs)',
  '/(tabs)/transactions',
  '/(tabs)/accounts',
  '/(tabs)/bank-connections',
  '/(tabs)/companies',
  '/(tabs)/titles',
  '/(tabs)/users',
  '/(tabs)/user',
];

export function SwipeableTabWrapper({ children }: SwipeableTabWrapperProps) {
  const pathname = usePathname();
  const { isAdmin } = usePermissions();

  // Obter índice da aba atual
  const getCurrentTabIndex = (): number => {
    // Normalizar pathname
    const normalizedPath = pathname || '/(tabs)';
    let index = TAB_PATHS.indexOf(normalizedPath);
    
    // Se não encontrou exato, tentar match parcial
    if (index === -1) {
      index = TAB_PATHS.findIndex(tab => normalizedPath.includes(tab.replace('/(tabs)/', '')));
    }
    
    // Se ainda não encontrou, usar índice 0 (dashboard)
    return index >= 0 ? index : 0;
  };

  // Obter lista de abas disponíveis baseado em permissões
  const getAvailableTabs = (): string[] => {
    return TAB_PATHS.filter((tab) => {
      // Se for /users e não for admin, não incluir
      if (tab === '/(tabs)/users' && !isAdmin) {
        return false;
      }
      return true;
    });
  };

  // Navegar para próxima aba
  const goToNextTab = () => {
    const currentIndex = getCurrentTabIndex();
    const availableTabs = getAvailableTabs();
    const currentTab = TAB_PATHS[currentIndex];
    const availableIndex = availableTabs.indexOf(currentTab);
    
    if (availableIndex >= 0 && availableIndex < availableTabs.length - 1) {
      const nextTab = availableTabs[availableIndex + 1];
      router.push(nextTab as any);
    }
  };

  // Navegar para aba anterior
  const goToPreviousTab = () => {
    const currentIndex = getCurrentTabIndex();
    const availableTabs = getAvailableTabs();
    const currentTab = TAB_PATHS[currentIndex];
    const availableIndex = availableTabs.indexOf(currentTab);
    
    if (availableIndex > 0) {
      const previousTab = availableTabs[availableIndex - 1];
      router.push(previousTab as any);
    }
  };

  // Gesture de swipe horizontal
  // Configurado para não interferir com ScrollViews verticais
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Só ativa se mover pelo menos 20px horizontalmente
    .failOffsetY([-25, 25]) // Falha se mover muito verticalmente (prioriza scroll vertical)
    .minDistance(25) // Distância mínima antes de ativar
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      
      // Threshold: precisa mover pelo menos 70px ou ter velocidade suficiente
      // Isso evita navegação acidental durante scroll
      const threshold = 70;
      const velocityThreshold = 500;
      
      if (translationX > threshold || velocityX > velocityThreshold) {
        // Swipe para direita = aba anterior
        goToPreviousTab();
      } else if (translationX < -threshold || velocityX < -velocityThreshold) {
        // Swipe para esquerda = próxima aba
        goToNextTab();
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.container}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
