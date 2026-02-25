import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompanySelector } from './CompanySelector';
import { IconSymbol } from './ui/icon-symbol';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
    visible?: boolean;
  };
  showCompanySelector?: boolean;
  leftIcon?: string; // Novo: ícone decorativo à esquerda do título
  leftIconColor?: string; // Cor personalizada para o ícone
}

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
  showCompanySelector = true,
  leftIcon,
  leftIconColor = '#00b09b',
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    hasStartedRef.current = false;

    // Parar animação anterior SEM callbacks
    const stopPreviousAnimation = () => {
      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    };

    // Resetar valores diretamente
    const resetValues = () => {
      try {
        if (isMountedRef.current) {
          fadeAnim.setValue(0);
          slideAnim.setValue(-20);
          scaleAnim.setValue(0.95);
        }
      } catch (error) {
        // Ignorar erros de imutabilidade
      }
    };

    stopPreviousAnimation();
    resetValues();

    // Usar requestAnimationFrame para garantir estabilidade
    const rafId = requestAnimationFrame(() => {
      if (!isMountedRef.current || hasStartedRef.current) return;

      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current || hasStartedRef.current) return;
        hasStartedRef.current = true;

        try {
          animationRef.current = Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 0,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]);

          animationRef.current.start();
        } catch (error) {
          hasStartedRef.current = false;
        }
      }, Platform.OS === 'android' ? 100 : 50);

      return () => {
        clearTimeout(timeoutId);
      };
    });

    return () => {
      isMountedRef.current = false;
      hasStartedRef.current = false;
      cancelAnimationFrame(rafId);

      try {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
      } catch (error) {
        // Ignorar erros durante cleanup
      }
    };
  }, [title, fadeAnim, slideAnim, scaleAnim]);

  // Usar useMemo para estabilizar objetos de estilo
  const headerStyle = useMemo(() => ({
    paddingTop: insets.top + 16,
    opacity: fadeAnim,
    transform: [
      { translateY: slideAnim },
      { scale: scaleAnim },
    ],
  }), [insets.top, fadeAnim, slideAnim, scaleAnim]);

  const titleStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateX: slideAnim }],
  }), [fadeAnim, slideAnim]);

  const subtitleStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateX: slideAnim }],
  }), [fadeAnim, slideAnim]);

  const actionsStyle = useMemo(() => ({
    opacity: fadeAnim,
    transform: [{ translateX: Animated.multiply(slideAnim, -1) }],
  }), [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.header, headerStyle]}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <Animated.View style={[titleStyle, styles.titleContainer]}>
            <View style={styles.titleRow}>
              {leftIcon && (
                <View style={styles.leftIconContainer}>
                  <IconSymbol name={leftIcon as any} size={28} color={leftIconColor} />
                </View>
              )}
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>
          </Animated.View>
          {subtitle && (
            <Animated.View style={[subtitleStyle, styles.subtitleContainer]}>
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            </Animated.View>
          )}
        </View>

        <Animated.View style={[styles.headerActions, actionsStyle]}>
          {rightAction && rightAction.visible !== false && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={rightAction.onPress}
              activeOpacity={0.7}>
              <MaterialIcons name={rightAction.icon as any} size={28} color="#00b09b" />
            </TouchableOpacity>
          )}
          {showCompanySelector && <CompanySelector />}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'nowrap',
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0, // Permite que o texto seja truncado se necessário
    flexShrink: 1, // Permite encolher se necessário
    marginRight: 8,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  titleContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  leftIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 176, 155, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: -0.2,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 176, 155, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    lineHeight: 30,
    flexShrink: 1,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  subtitleContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 16,
    flexShrink: 1,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0, // Não permite que os botões encolham
  },
  actionButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
