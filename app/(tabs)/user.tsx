import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedBackground } from "@/components/animated-background";
import { GlassContainer } from "@/components/glass-container";
import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useNotification } from "@/hooks/use-notification";
import { TELOS_LOGO } from "@/lib/assets";
import {
  getRoleColor,
  getRoleDescription,
  getRoleName,
} from "@/lib/services/profiles";
import { supabase } from "@/lib/supabase";

export default function UserScreen() {
  const insets = useSafeAreaInsets();
  const { user, userRole, signOut } = useAuth();
  const { canEdit, canDelete, isAdmin, isViewerOnly } = usePermissions();
  const { showError, showSuccess, showWarning, showInfo } = useNotification();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    setName(user?.user_metadata?.name || user?.email?.split("@")[0] || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await withTimeout(
        signOut(),
        12000,
        "Tempo limite excedido ao sair da conta.",
      );
    } catch (err) {
      console.error("Erro no logout:", err);
      showWarning(
        "Não foi possível encerrar totalmente no servidor, mas você será desconectado localmente.",
      );
    } finally {
      setLogoutLoading(false);
      router.replace("/login");
    }
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  const userEmail = user?.email || "Não disponível";
  const passwordMasked = "••••••••";

  const userFields = [
    { label: "Usuário", value: userName, icon: "person" },
    { label: "Email", value: userEmail, icon: "email" },
    { label: "Senha", value: passwordMasked, icon: "lock" },
  ];

  const isEmailValid = (value: string) => /\S+@\S+\.\S+/.test(value);

  const resetEditForm = () => {
    setName(user?.user_metadata?.name || user?.email?.split("@")[0] || "");
    setEmail(user?.email || "");
    setPassword("");
    setIsEditing(false);
  };

  const withTimeout = async <T,>(
    promise: Promise<T>,
    timeoutMs: number,
    timeoutMessage: string,
  ): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  };

  const showInfoIfEmailChanged = () => {
    showWarning(
      "E-mail alterado. Verifique sua caixa de entrada para confirmar o novo endereço.",
    );
  };

  const handleSaveProfile = async () => {
    if (!user) {
      showError("Usuário não autenticado.");
      return;
    }

    if (!name.trim()) {
      showWarning("Informe um nome válido.");
      return;
    }

    if (!email.trim() || !isEmailValid(email.trim())) {
      showWarning("Informe um e-mail válido.");
      return;
    }

    if (password && password.length < 6) {
      showWarning("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }

    const nextName = name.trim();
    const nextEmail = email.trim();
    const currentName = (
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      ""
    ).trim();
    const currentEmail = (user?.email || "").trim();

    const hasNameChanged = nextName !== currentName;
    const hasEmailChanged =
      nextEmail.toLowerCase() !== currentEmail.toLowerCase();
    const hasPasswordChanged = Boolean(password);

    if (!hasNameChanged && !hasEmailChanged && !hasPasswordChanged) {
      showInfo("Nenhuma alteração para salvar.");
      setIsEditing(false);
      return;
    }

    setSaveLoading(true);
    try {
      if (hasNameChanged) {
        const { error: updateNameError } = await withTimeout(
          supabase.auth.updateUser({ data: { name: nextName } }),
          15000,
          "Tempo limite excedido ao atualizar nome.",
        );

        if (updateNameError) {
          throw updateNameError;
        }
      }

      if (hasEmailChanged) {
        const { error: updateEmailError } = await withTimeout(
          supabase.auth.updateUser({ email: nextEmail }),
          15000,
          "Tempo limite excedido ao atualizar e-mail.",
        );

        if (updateEmailError) {
          throw updateEmailError;
        }
      }

      if (hasPasswordChanged) {
        const { error: updatePasswordError } = await withTimeout(
          supabase.auth.updateUser({ password }),
          15000,
          "Tempo limite excedido ao atualizar senha.",
        );

        if (updatePasswordError) {
          throw updatePasswordError;
        }
      }

      setPassword("");
      setIsEditing(false);
      showSuccess("Dados atualizados com sucesso!", { iconType: "user" });

      if (hasEmailChanged) {
        showInfoIfEmailChanged();
      }
    } catch (error: any) {
      showError(error?.message || "Não foi possível atualizar seus dados.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Usuário
          </ThemedText>
        </View>

        {/* User Info Card com Glassmorphism */}
        <GlassContainer style={styles.glassCard}>
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Dados da Conta
            </ThemedText>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.smallActionButton}
                onPress={() => setIsEditing(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="edit" size={16} color="#00b09b" />
                <Text style={styles.smallActionButtonText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.smallActionButton}
                onPress={resetEditForm}
                activeOpacity={0.8}
                disabled={saveLoading}
              >
                <MaterialIcons name="close" size={16} color="#FCA5A5" />
                <Text
                  style={[styles.smallActionButtonText, { color: "#FCA5A5" }]}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.cardContent}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel} type="defaultSemiBold">
                  Nome
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel} type="defaultSemiBold">
                  Email
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel} type="defaultSemiBold">
                  Nova senha (opcional)
                </ThemedText>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saveLoading && styles.logoutButtonDisabled,
                ]}
                onPress={handleSaveProfile}
                activeOpacity={0.8}
                disabled={saveLoading}
              >
                <Text style={styles.logoutButtonText}>
                  {saveLoading ? "Salvando..." : "Salvar alterações"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cardContent}>
              {userFields.map((field, index) => (
                <View key={field.label}>
                  <View style={styles.fieldRow}>
                    <View style={styles.fieldLeft}>
                      <MaterialIcons
                        name={field.icon as any}
                        size={20}
                        color="#00b09b"
                        style={styles.fieldIcon}
                      />
                      <ThemedText
                        style={styles.fieldLabel}
                        type="defaultSemiBold"
                      >
                        {field.label}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.fieldValue}>
                      {field.value}
                    </ThemedText>
                  </View>
                  {index < userFields.length - 1 && (
                    <View style={styles.fieldDivider} />
                  )}
                </View>
              ))}
            </View>
          )}
        </GlassContainer>

        {/* Perfil e Permissões */}
        <GlassContainer style={styles.glassCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Perfil e Permissões
          </ThemedText>
          <View style={styles.cardContent}>
            {/* Perfil Atual */}
            <View style={styles.profileRow}>
              <View style={styles.fieldLeft}>
                <MaterialIcons name="badge" size={20} color="#00b09b" />
                <ThemedText style={styles.fieldLabel} type="defaultSemiBold">
                  Perfil
                </ThemedText>
              </View>
              <View
                style={[
                  styles.roleBadge,
                  { backgroundColor: `${getRoleColor(userRole)}20` },
                ]}
              >
                <Text
                  style={[styles.roleText, { color: getRoleColor(userRole) }]}
                >
                  {userRole ? getRoleName(userRole) : "Sem Perfil"}
                </Text>
              </View>
            </View>

            {userRole && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.descriptionBox}>
                  <ThemedText style={styles.descriptionText}>
                    {getRoleDescription(userRole)}
                  </ThemedText>
                </View>

                <View style={styles.fieldDivider} />

                {/* Permissões */}
                <View style={styles.permissionsContainer}>
                  <ThemedText style={styles.permissionsTitle}>
                    Permissões:
                  </ThemedText>
                  <View style={styles.permissionsList}>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={isAdmin ? "check-circle" : "cancel"}
                        size={18}
                        color={isAdmin ? "#10B981" : "#9CA3AF"}
                      />
                      <ThemedText style={styles.permissionText}>
                        Gerenciar usuários
                      </ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={canEdit ? "check-circle" : "cancel"}
                        size={18}
                        color={canEdit ? "#10B981" : "#9CA3AF"}
                      />
                      <ThemedText style={styles.permissionText}>
                        Criar e editar dados
                      </ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name={canDelete ? "check-circle" : "cancel"}
                        size={18}
                        color={canDelete ? "#10B981" : "#9CA3AF"}
                      />
                      <ThemedText style={styles.permissionText}>
                        Deletar dados
                      </ThemedText>
                    </View>
                    <View style={styles.permissionItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={18}
                        color="#10B981"
                      />
                      <ThemedText style={styles.permissionText}>
                        Visualizar dados
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </>
            )}

            {!userRole && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.noProfileBox}>
                  <MaterialIcons name="warning" size={24} color="#FBBF24" />
                  <ThemedText style={styles.noProfileText}>
                    Você ainda não possui um perfil atribuído. Entre em contato
                    com um administrador.
                  </ThemedText>
                </View>
              </>
            )}
          </View>
        </GlassContainer>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            logoutLoading && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={logoutLoading}
          activeOpacity={0.8}
        >
          {logoutLoading ? (
            <Text style={styles.logoutButtonText}>Saindo...</Text>
          ) : (
            <>
              <MaterialIcons name="logout" size={20} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Footer com Logo e Copyright */}
        <View style={styles.footer}>
          <Image
            source={TELOS_LOGO}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.copyright}>
            Todos os direitos reservados p/ Télos Control Devops, com copyright
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    color: "#FFFFFF",
  },
  glassCard: {
    padding: 24,
  },
  cardContent: {
    gap: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  smallActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  smallActionButtonText: {
    color: "#00b09b",
    fontSize: 13,
    fontWeight: "600",
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.85)",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#FFFFFF",
    fontSize: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  saveButton: {
    marginTop: 8,
    backgroundColor: "#00b09b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fieldIcon: {
    // Ícone já tem tamanho definido
  },
  fieldLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "right",
  },
  fieldDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 16,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "700",
  },
  descriptionBox: {
    backgroundColor: "rgba(0, 176, 155, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  permissionsContainer: {
    gap: 12,
  },
  permissionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  permissionsList: {
    gap: 10,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  permissionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  noProfileBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderRadius: 8,
    padding: 12,
  },
  noProfileText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00b09b",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    alignItems: "center",
    marginTop: 48,
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  footerLogo: {
    width: 150,
    height: 60,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 18,
  },
});
