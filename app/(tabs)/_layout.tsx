import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { HapticTab } from "@/components/haptic-tab";
import { SwipeableTabWrapper } from "@/components/swipeable-tab-wrapper";
import { usePermissions } from "@/contexts/PermissionsContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  useColorScheme();
  const { isAdmin } = usePermissions();

  return (
    <SidebarProvider>
      <SwipeableTabWrapper>
        <Tabs
          screenOptions={{
            tabBarActiveTintColor: "#00b09b",
            tabBarInactiveTintColor: "rgba(255, 255, 255, 0.6)",
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: "#001a2e",
              borderTopColor: "rgba(255, 255, 255, 0.1)",
              borderTopWidth: 1,
              height: 90,
              paddingTop: 8,
              paddingBottom: 0,
            },
            tabBarItemStyle: {
              paddingVertical: 0,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="home" size={28} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: "Gerenciar Usuários",
              tabBarIcon: ({ color }) => (
                <MaterialIcons
                  name="supervisor-account"
                  size={28}
                  color={color}
                />
              ),
              href: isAdmin ? "/users" : null,
            }}
          />
          <Tabs.Screen
            name="user"
            options={{
              title: "Perfil",
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="settings" size={28} color={color} />
              ),
            }}
          />

          <Tabs.Screen name="transactions" options={{ href: null }} />
          <Tabs.Screen name="accounts" options={{ href: null }} />
          <Tabs.Screen name="bank-connections" options={{ href: null }} />
          <Tabs.Screen name="companies" options={{ href: null }} />
          <Tabs.Screen name="titles" options={{ href: null }} />
        </Tabs>
        <AppSidebar />
      </SwipeableTabWrapper>
    </SidebarProvider>
  );
}
