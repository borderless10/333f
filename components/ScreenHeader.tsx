import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CompanySelector } from './CompanySelector';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
    visible?: boolean;
  };
  showCompanySelector?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  rightAction,
  showCompanySelector = true,
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Animação de entrada suave
    Animated.parallel([
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
    ]).start();
  }, [title]);

  return (
    <Animated.View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 16,
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}>
      <View style={styles.headerContent}>
        <View style={styles.headerTextContainer}>
          <Animated.View
            style={[
              {
                opacity: fadeAnim,
                transform: [{ translateX: slideAnim }],
              },
              styles.titleContainer,
            ]}>
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </Animated.View>
          {subtitle && (
            <Animated.View
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }],
                },
                styles.subtitleContainer,
              ]}>
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {subtitle}
              </Text>
            </Animated.View>
          )}
        </View>

        <Animated.View
          style={[
            styles.headerActions,
            {
              opacity: fadeAnim,
              transform: [{ translateX: Animated.multiply(slideAnim, -1) }],
            },
          ]}>
          {showCompanySelector && <CompanySelector />}
          {rightAction && rightAction.visible !== false && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={rightAction.onPress}
              activeOpacity={0.7}>
              <MaterialIcons name={rightAction.icon as any} size={28} color="#00b09b" />
            </TouchableOpacity>
          )}
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
