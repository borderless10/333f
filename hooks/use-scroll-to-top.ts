import { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Hook que retorna uma ref para ScrollView e automaticamente
 * rola para o topo quando a tela ganha foco
 */
export function useScrollToTop() {
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      // Quando a tela ganha foco, rola para o topo
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  return scrollRef;
}
