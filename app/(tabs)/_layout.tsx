import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { usePermissions } from '@/contexts/PermissionsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isAdmin } = usePermissions();
  const pathname = usePathname();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animação de fade quando troca de aba
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [pathname]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#00b09b',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false, // Ocultar texto completamente
        tabBarStyle: {
          backgroundColor: '#001a2e',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          height: 90, // ✅ Altura maior para facilitar acesso no mobile
          paddingTop: 8, // ✅ Mais espaço superior para ícones ficarem mais para cima
          paddingBottom: 0, // ✅ Sem espaço inferior
        },
        tabBarItemStyle: {
          paddingVertical: 0, // ✅ Sem padding vertical para ícones ficarem mais para cima
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transações',
          tabBarIcon: ({ color }) => <MaterialIcons name="attach-money" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Contas',
          tabBarIcon: ({ color }) => <MaterialIcons name="account-balance" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="companies"
        options={{
          title: 'Empresas',
          tabBarIcon: ({ color }) => <MaterialIcons name="business" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="titles"
        options={{
          title: 'Títulos',
          tabBarIcon: ({ color }) => <MaterialIcons name="description" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuários',
          tabBarIcon: ({ color }) => <MaterialIcons name="supervisor-account" size={28} color={color} />,
          href: isAdmin ? '/users' : null,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={28} color={color} />,
        }}
      />
    </Tabs>
    </Animated.View>
  );
}
