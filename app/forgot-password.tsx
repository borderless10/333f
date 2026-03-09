import { AnimatedBackground } from "@/components/animated-background";
import { GlassContainer } from "@/components/glass-container";
import { ThemedText } from "@/components/themed-text";
import { TELOS_LOGO } from "@/lib/assets";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    // Apenas UI por enquanto — sem funcionalidade
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.hero}>
              <Image
                source={TELOS_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.divider} />
              <ThemedText style={styles.subtitle}>
                Recuperar acesso à sua conta
              </ThemedText>
            </View>

            <GlassContainer style={styles.glassCard}>
              <View style={styles.formContent}>
                <ThemedText style={styles.infoText}>
                  Informe o e-mail cadastrado que enviaremos instruções para
                  redefinir sua senha.
                </ThemedText>

                <View style={styles.inputContainer}>
                  <ThemedText style={styles.inputLabel} type="defaultSemiBold">
                    Email
                  </ThemedText>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    loading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleSend}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Enviando..." : "Enviar instruções"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => router.push("/login")}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="arrow-back" size={16} color="#00b09b" />
                  <Text style={styles.backLinkText}> Voltar ao login</Text>
                </TouchableOpacity>
              </View>
            </GlassContainer>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingBottom: 40 },
  content: { paddingHorizontal: 24, gap: 32 },
  hero: { alignItems: "center", gap: 12 },
  logoImage: { width: 260, height: 100, marginBottom: 8 },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#00b09b",
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  glassCard: { padding: 24 },
  formContent: { gap: 16 },
  infoText: { color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 8 },
  inputContainer: { marginBottom: 8 },
  inputLabel: { marginBottom: 8, fontSize: 14, color: "#FFFFFF" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "#FFFFFF",
  },
  loginButton: {
    backgroundColor: "#00b09b",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  backLinkText: { fontSize: 14, color: "#00b09b" },
});
