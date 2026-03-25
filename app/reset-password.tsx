import { AnimatedBackground } from "@/components/animated-background";
import { GlassContainer } from "@/components/glass-container";
import { ThemedText } from "@/components/themed-text";
import { PasswordInput } from "@/components/ui/password-input";
import { useNotification } from "@/hooks/use-notification";
import { TELOS_LOGO } from "@/lib/assets";
import { supabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Extrai access_token e refresh_token da URL de callback de reset (hash # ou query ?).
 * Supabase envia os tokens no fragmento ou query após o clique no link de recuperação.
 */
function parseResetTokensFromUrl(url: string): {
  access_token?: string;
  refresh_token?: string;
  error?: string;
} {
  try {
    const hashIdx = url.indexOf("#");
    const queryIdx = url.indexOf("?");
    const fragment = hashIdx >= 0 ? url.substring(hashIdx + 1) : "";
    const query = queryIdx >= 0 ? url.substring(queryIdx + 1) : "";
    const paramsStr = fragment || query;
    if (!paramsStr) return {};
    const params = new URLSearchParams(paramsStr);
    const error =
      params.get("error_description") || params.get("error") || undefined;
    return {
      access_token: params.get("access_token") || undefined,
      refresh_token: params.get("refresh_token") || undefined,
      error,
    };
  } catch {
    return {};
  }
}

/**
 * Cria sessão no Supabase a partir do callback de reset de senha.
 */
async function setResetSession(url: string): Promise<void> {
  const { access_token, refresh_token, error } = parseResetTokensFromUrl(url);
  if (error) throw new Error(error);
  if (!access_token || !refresh_token) {
    throw new Error("Link de recuperação inválido ou expirado.");
  }
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}

type ResetStage = "loading" | "form" | "success" | "error";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useNotification();

  const [stage, setStage] = useState<ResetStage>("loading");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ao montar, extrair tokens da URL e estabelecer sessão
  useEffect(() => {
    const initializeReset = async () => {
      try {
        // Tentar getInitialURL primeiro (para quando app é aberto via deep link)
        let currentUrl = await Linking.getInitialURL();

        if (!currentUrl) {
          // Se não há URL inicial, aguardar por um link (handled via listener)
          // Isso permite que o fluxo funcione quando o app já está em execução
          // Por enquanto, esperamos um pouco para o Linking capturar o URL
          await new Promise((resolve) => setTimeout(resolve, 500));
          currentUrl = await Linking.getInitialURL();
        }

        if (!currentUrl) {
          throw new Error("Nenhuma URL de recuperação encontrada.");
        }

        await setResetSession(currentUrl);
        setStage("form");
      } catch (err: any) {
        console.error("Erro ao processar link de recuperação:", err);
        setErrorMessage(
          err?.message ||
            "Link de recuperação inválido ou expirado. Solicite um novo.",
        );
        setStage("error");
        showError(
          err?.message || "Não foi possível processar seu link de recuperação.",
        );
      }
    };

    initializeReset();

    // Listener para capturar deep links quando app já está em background
    if (Platform.OS !== "web") {
      const subscription = Linking.addEventListener("url", ({ url }) => {
        setResetSession(url)
          .then(() => {
            setStage("form");
            setErrorMessage(null);
          })
          .catch((err: any) => {
            console.error("Erro ao processar link recebido:", err);
            setErrorMessage(
              err?.message ||
                "Link de recuperação inválido ou expirado. Solicite um novo.",
            );
            setStage("error");
            showError(err?.message || "Erro ao processar seu link.");
          });
      });

      return () => subscription.remove();
    }
  }, []);

  const validarFormulario = (): boolean => {
    setErrorMessage(null);

    // Validação: campos obrigatórios
    if (!password || !passwordConfirm) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return false;
    }

    // Validação: senha mínima
    if (password.length < 6) {
      setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      return false;
    }

    // Validação: senhas iguais
    if (password !== passwordConfirm) {
      setErrorMessage("As senhas não coincidem. Verifique e tente novamente.");
      return false;
    }

    return true;
  };

  const handleResetPassword = async () => {
    if (!validarFormulario() || saving) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setStage("success");
      showSuccess("Senha redefinida com sucesso!", { iconType: "key" });
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      const mensagem =
        err?.message || "Não foi possível redefinir a senha. Tente novamente.";
      setErrorMessage(mensagem);
      showError(mensagem);
    } finally {
      setSaving(false);
    }
  };

  if (stage === "loading") {
    return (
      <View style={styles.container}>
        <AnimatedBackground />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Carregando...</ThemedText>
        </View>
      </View>
    );
  }

  if (stage === "error") {
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
                <ThemedText style={styles.subtitle}>Redefinir senha</ThemedText>
              </View>

              <GlassContainer style={styles.glassCard}>
                <View style={styles.errorContainer}>
                  <MaterialIcons
                    name="error-outline"
                    size={48}
                    color="#EF4444"
                  />
                  <ThemedText style={styles.errorTitle}>
                    Link inválido ou expirado
                  </ThemedText>
                  <ThemedText style={styles.errorMessage}>
                    {errorMessage ||
                      "O link de recuperação é válido por 24 horas. Solicite um novo."}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => router.push("/forgot-password")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    Solicitar novo link
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
              </GlassContainer>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  if (stage === "success") {
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
                <ThemedText style={styles.subtitle}>Redefinir senha</ThemedText>
              </View>

              <GlassContainer style={styles.glassCard}>
                <View style={styles.successContainer}>
                  <MaterialIcons
                    name="check-circle"
                    size={48}
                    color="#10B981"
                  />
                  <ThemedText style={styles.successTitle}>
                    Senha redefinida!
                  </ThemedText>
                  <ThemedText style={styles.successMessage}>
                    Sua senha foi atualizada com sucesso. Você será
                    redirecionado para o login.
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={() => {
                    // Fazer logout para forçar novo login com a nova senha
                    supabase.auth.signOut().then(() => {
                      router.replace("/login");
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>Ir ao login</Text>
                </TouchableOpacity>
              </GlassContainer>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // stage === "form"
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
              <ThemedText style={styles.subtitle}>Redefinir senha</ThemedText>
            </View>

            <GlassContainer style={styles.glassCard}>
              <View style={styles.formContent}>
                <ThemedText style={styles.infoText}>
                  Escolha uma nova senha para sua conta.
                </ThemedText>

                <PasswordInput
                  label="Nova senha"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  returnKeyType="next"
                />

                <PasswordInput
                  label="Confirmar senha"
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChangeText={(text) => {
                    setPasswordConfirm(text);
                    setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  returnKeyType="send"
                  onSubmitEditing={handleResetPassword}
                />

                {errorMessage && (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    saving && styles.loginButtonDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.loginButtonText}>
                    {saving ? "Salvando..." : "Redefinir senha"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => router.push("/login")}
                  activeOpacity={0.8}
                  disabled={saving}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  errorContainer: {
    alignItems: "center",
    gap: 16,
    marginVertical: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  errorText: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 8,
    marginTop: -4,
  },
  successContainer: {
    alignItems: "center",
    gap: 16,
    marginVertical: 8,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#10B981",
    marginTop: 8,
  },
  successMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
});
