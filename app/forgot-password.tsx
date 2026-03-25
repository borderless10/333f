import { AnimatedBackground } from "@/components/animated-background";
import { GlassContainer } from "@/components/glass-container";
import { toastConfig } from "@/components/NotificationToast";
import { ThemedText } from "@/components/themed-text";
import { TELOS_LOGO } from "@/lib/assets";
import { supabase } from "@/lib/supabase";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
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
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const toastRef = useRef<any>(null);

  // Validar formato de email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSend = async () => {
    console.log("[ForgotPassword] Iniciando envio para email:", email);

    // Validação: campo obrigatório
    if (!email || !email.trim()) {
      console.log("[ForgotPassword] Email vazio");
      setError("Por favor, informe seu e-mail.");
      return;
    }

    // Validação: formato de email
    if (!validarEmail(email)) {
      console.log("[ForgotPassword] Email inválido:", email);
      setError("Por favor, insira um e-mail válido (exemplo: seu@email.com).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // URL de retorno para o app com a rota de reset de senha
      // O scheme 333f é definido em app.json e permite deep linking
      const redirectTo = Linking.createURL("/reset-password");
      console.log("[ForgotPassword] Redirect URL:", redirectTo);

      // Chamar resetPasswordForEmail do Supabase
      console.log(
        "[ForgotPassword] Chamando supabase.auth.resetPasswordForEmail...",
      );
      const { error: resetError, data } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo,
        });

      console.log("[ForgotPassword] Resposta do Supabase:", {
        error: resetError,
        data,
      });

      if (resetError) {
        console.error("[ForgotPassword] Erro do Supabase:", resetError);
        throw resetError;
      }

      // Sucesso: mostrar mensagem de confirmação
      console.log("[ForgotPassword] Email enviado com sucesso!");
      setSent(true);
      setError(null);

      // Toast com fallback visual
      Toast.show({
        type: "success",
        text1: "E-mail enviado!",
        text2: "Verifique sua caixa de entrada e pasta de spam.",
        visibilityTime: 5000,
      });

      // Alert como fallback visual adicional
      Alert.alert(
        "E-mail enviado com sucesso! ✓",
        "Verifique sua caixa de entrada e pasta de spam para as instruções de redefinição de senha. O link é válido por 24 horas.",
        [{ text: "OK" }],
      );
    } catch (err: any) {
      console.error("[ForgotPassword] Erro capturado:", err);
      console.error("[ForgotPassword] Detalhes do erro:", {
        message: err?.message,
        code: err?.code,
        status: err?.status,
        fullError: err,
      });

      const mensagem =
        err?.message ||
        "Erro ao enviar e-mail de recuperação. Tente novamente.";

      // Mensagens mais específicas conforme o erro
      let errorMsg = mensagem;
      if (
        mensagem.includes("email not found") ||
        mensagem.includes("not exist")
      ) {
        errorMsg =
          "Este e-mail não está cadastrado no sistema. Verifique e tente novamente.";
      } else if (mensagem.includes("network")) {
        errorMsg = "Erro de conexão. Verifique sua internet e tente novamente.";
      } else if (mensagem.includes("redirect")) {
        errorMsg =
          "Erro na configuração de redirect URL. Verifique com o administrador.";
      }

      setError(errorMsg);

      // Toast de erro
      Toast.show({
        type: "error",
        text1: "Erro ao enviar",
        text2: errorMsg,
        visibilityTime: 5000,
      });

      // Alert como fallback visual
      Alert.alert("Erro ao enviar e-mail ✗", errorMsg, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
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
                {sent ? (
                  <>
                    <View style={styles.successContainer}>
                      <MaterialIcons
                        name="check-circle"
                        size={48}
                        color="#10B981"
                      />
                      <ThemedText style={styles.successTitle}>
                        E-mail enviado!
                      </ThemedText>
                      <ThemedText style={styles.successMessage}>
                        Verifique sua caixa de entrada e pasta de spam para as
                        instruções de redefinição de senha. O link é válido por
                        24 horas.
                      </ThemedText>
                    </View>

                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={() => router.push("/login")}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.loginButtonText}>
                        Voltar ao login
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backLink}
                      onPress={() => {
                        setSent(false);
                        setEmail("");
                        setError(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backLinkText}>
                        Tentar com outro e-mail
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.infoText}>
                      Informe o e-mail cadastrado que enviaremos instruções para
                      redefinir sua senha.
                    </ThemedText>

                    <View style={styles.inputContainer}>
                      <ThemedText
                        style={styles.inputLabel}
                        type="defaultSemiBold"
                      >
                        Email
                      </ThemedText>
                      <TextInput
                        style={styles.input}
                        placeholder="seu@email.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          setError(null); // Limpar erro ao editar
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="send"
                        onSubmitEditing={handleSend}
                        editable={!loading}
                      />
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

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
                      disabled={loading}
                    >
                      <MaterialIcons
                        name="arrow-back"
                        size={16}
                        color="#00b09b"
                      />
                      <Text style={styles.backLinkText}> Voltar ao login</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </GlassContainer>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast config={toastConfig} topOffset={60} />
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
  errorText: {
    fontSize: 14,
    color: "#FF6B6B",
    marginBottom: 8,
    marginTop: -4,
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
