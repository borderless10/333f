import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Hook para animações de entrada em telas
 * Retorna valores animados para fade-in e slide-up
 */
export function useScreenAnimations(delay: number = 0) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return {
    fadeAnim,
    slideAnim,
    animatedStyle: {
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    },
  };
}

/**
 * Hook para animações escalonadas de lista
 * Retorna array de valores animados para itens de lista
 */
export function useListAnimations(itemCount: number, baseDelay: number = 100) {
  const anims = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    anims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: baseDelay + index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, [itemCount]);

  return anims.map((anim, index) => ({
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-20, 0],
        }),
      },
    ],
  }));
}
