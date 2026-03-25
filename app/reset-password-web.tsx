import { useSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";

export default function ResetPasswordWeb() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processRedirect = async () => {
      try {
        // Extract tokens from URL
        const code = searchParams.get("code");
        const accessToken = searchParams.get("access_token");
        const refreshToken = searchParams.get("refresh_token");
        const type = searchParams.get("type");

        console.log("Reset Password Web - Params:", {
          code,
          accessToken: accessToken ? "***" : null,
          refreshToken: refreshToken ? "***" : null,
          type,
        });

        // Check if we have necessary tokens
        if (!accessToken || !refreshToken) {
          throw new Error("Tokens não encontrados na URL. Tente novamente.");
        }

        // Build deep link with tokens
        const deepLink = `333f://reset-password?access_token=${encodeURIComponent(
          accessToken,
        )}&refresh_token=${encodeURIComponent(refreshToken)}&type=${type || "recovery"}`;

        console.log("Redirecting to deep link:", deepLink);

        // Try to open the deep link
        const canOpen = await Linking.canOpenURL(deepLink);

        if (canOpen) {
          // Open the app deep link
          await Linking.openURL(deepLink);
          // Close the web browser
          await WebBrowser.dismissBrowser();
        } else {
          // Fallback: if app is not installed, show error
          setError(
            "App não encontrado. Por favor, instale o app e tente novamente via email.",
          );
          setIsProcessing(false);
        }
      } catch (err) {
        console.error("Error processing redirect:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Erro ao processar link de reset. Tente novamente.",
        );
        setIsProcessing(false);
      }
    };

    processRedirect();
  }, [searchParams]);

  if (isProcessing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 16, fontSize: 16, color: "#333" }}>
          Abrindo app...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: "#e74c3c",
            marginBottom: 12,
          }}
        >
          Erro
        </Text>
        <Text style={{ fontSize: 14, color: "#666", textAlign: "center" }}>
          {error}
        </Text>
      </View>
    );
  }

  return null;
}
