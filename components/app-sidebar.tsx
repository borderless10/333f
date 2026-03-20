import { useOptionalSidebar } from "@/contexts/SidebarContext";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, usePathname } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SIDEBAR_WIDTH = 280;

const SIDEBAR_ITEMS = [
  { title: "Transacoes", route: "/(tabs)/transactions", icon: "attach-money" },
  { title: "Contas", route: "/(tabs)/accounts", icon: "account-balance" },
  { title: "Conexoes", route: "/(tabs)/bank-connections", icon: "link" },
  { title: "Empresas", route: "/(tabs)/companies", icon: "business" },
  { title: "Titulos", route: "/(tabs)/titles", icon: "description" },
] as const;

export function AppSidebar() {
  const sidebar = useOptionalSidebar();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isOpen = Boolean(sidebar?.isOpen);

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: isOpen ? 0 : -SIDEBAR_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: isOpen ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayOpacity, sidebar?.isOpen, translateX]);

  if (!sidebar) return null;

  const isVisible = sidebar.isOpen;

  return (
    <View pointerEvents={isVisible ? "auto" : "none"} style={styles.container}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={sidebar.closeSidebar}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            paddingTop: insets.top + 16,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Menu</Text>
          <TouchableOpacity
            onPress={sidebar.closeSidebar}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="close"
              size={24}
              color="rgba(255, 255, 255, 0.85)"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.menuList}>
          {SIDEBAR_ITEMS.map((item) => {
            const active = pathname === item.route;
            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.menuItem, active && styles.menuItemActive]}
                activeOpacity={0.8}
                onPress={() => {
                  sidebar.closeSidebar();
                  router.push(item.route as any);
                }}
              >
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={active ? "#00b09b" : "rgba(255, 255, 255, 0.75)"}
                />
                <Text
                  style={[styles.menuText, active && styles.menuTextActive]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: "#001a2e",
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  menuList: {
    gap: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  menuItemActive: {
    backgroundColor: "rgba(0, 176, 155, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(0, 176, 155, 0.35)",
  },
  menuText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "600",
  },
  menuTextActive: {
    color: "#00b09b",
  },
});
