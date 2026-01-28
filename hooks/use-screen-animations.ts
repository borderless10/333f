import { useEffect, useMemo, useRef } from 'react';
import { Animated, Platform } from 'react-native';

/**
 * Hook para animações de entrada em telas
 * Retorna valores animados para fade-in e slide-up
 * 
 * Versão otimizada para Android/Fabric com validações rigorosas
 */
export function useScreenAnimations(delay: number = 0) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // CRÍTICO: Inicializar com 0 para evitar erro no Android/Fabric
  // O valor inicial numérico pode causar problemas quando renderizado antes da animação
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    hasStartedRef.current = false;

    // Parar animação anterior SEM callbacks para evitar problemas de propriedades somente leitura
    const stopPreviousAnimation = () => {
      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros silenciosamente - objeto pode já estar congelado
      }
    };

    // Resetar valores diretamente - sem callbacks que podem causar problemas
    const resetValues = () => {
      try {
        if (isMountedRef.current) {
          fadeAnim.setValue(0);
          // Resetar para 30 para iniciar a animação de slide
          slideAnim.setValue(30);
        }
      } catch (error) {
        // Ignorar erros de imutabilidade - pode acontecer durante cleanup
      }
    };

    // Parar e resetar
    stopPreviousAnimation();
    resetValues();

    // Usar requestAnimationFrame para garantir que o reset foi aplicado antes de iniciar nova animação
    const rafId = requestAnimationFrame(() => {
      if (!isMountedRef.current || hasStartedRef.current) return;

      // Delay adicional para garantir estabilidade no Android
      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current || hasStartedRef.current) return;
        hasStartedRef.current = true;

        try {
          // Criar novas animações sem reutilizar referências antigas
          const fadeAnimation = Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          });

          const slideAnimation = Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            delay,
            useNativeDriver: true,
          });

          animationRef.current = Animated.parallel([fadeAnimation, slideAnimation]);
          
          // Iniciar SEM callback para evitar problemas com propriedades somente leitura
          animationRef.current.start();
        } catch (error) {
          // Ignorar erros silenciosamente
          hasStartedRef.current = false;
        }
      }, Platform.OS === 'android' ? 100 : 50); // Delay maior no Android para garantir estabilidade

      return () => {
        clearTimeout(timeoutId);
      };
    });

    // Cleanup
    return () => {
      isMountedRef.current = false;
      hasStartedRef.current = false;
      
      // Cancelar requestAnimationFrame se ainda não executou
      cancelAnimationFrame(rafId);

      // Parar animação SEM callbacks
      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros durante cleanup - objeto pode já estar congelado
      }
    };
  }, [delay, fadeAnim, slideAnim]);

  // CRÍTICO: Usar useMemo para estabilizar o objeto de estilo
  // Isso evita que o objeto seja recriado a cada renderização,
  // o que pode causar problemas no Android/Fabric
  const animatedStyle = useMemo(() => {
    // Garantir que o objeto de estilo sempre tenha a estrutura correta
    // O translateY DEVE receber diretamente o Animated.Value, nunca um objeto
    // Usar interpolate para garantir que sempre retorne um Animated.Value válido
    return {
      opacity: fadeAnim,
      transform: [
        {
          translateY: slideAnim,
        },
      ],
    };
  }, [fadeAnim, slideAnim]);

  return {
    fadeAnim,
    slideAnim,
    animatedStyle,
  };
}

/**
 * Hook para animações escalonadas de lista
 * Retorna array de valores animados para itens de lista
 */
export function useListAnimations(itemCount: number, baseDelay: number = 100) {
  const anims = useRef<Animated.Value[]>([]).current;
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]).current;
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Limpar animações anteriores SEM callbacks
    const cleanupAnimations = () => {
      animationRefs.forEach((anim) => {
        try {
          anim?.stop();
        } catch (error) {
          // Ignorar erros silenciosamente
        }
      });
      animationRefs.length = 0;
    };

    cleanupAnimations();

    // Ajustar array de animações para o novo tamanho
    while (anims.length < itemCount) {
      anims.push(new Animated.Value(0));
    }
    while (anims.length > itemCount) {
      const removedAnim = anims.pop();
      try {
        removedAnim?.stopAnimation();
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    }

    // Resetar valores e iniciar novas animações
    anims.forEach((anim, index) => {
      try {
        anim.setValue(0);
        
        const animation = Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: baseDelay + index * 50,
          useNativeDriver: true,
        });

        animationRefs[index] = animation;
        // Iniciar SEM callback para evitar problemas com propriedades somente leitura
        animation.start();
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    });

    return () => {
      isMountedRef.current = false;
      
      // Parar todas as animações SEM callbacks
      animationRefs.forEach((anim) => {
        try {
          anim?.stop();
        } catch (error) {
          // Ignorar erros durante cleanup
        }
      });
    };
  }, [itemCount, baseDelay]);

  // Usar useMemo para estabilizar os objetos de estilo
  return useMemo(() => {
    return anims.map((anim) => ({
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
  }, [anims]);
}
