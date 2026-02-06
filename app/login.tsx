import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedBackground } from '@/components/animated-background';
import { GlassContainer } from '@/components/glass-container';
import { ThemedText } from '@/components/themed-text';
import { PasswordInput } from '@/components/ui/password-input';
import { TELOS_LOGO } from '@/lib/assets';
import { supabase } from '@/lib/supabase';

// Necessário para o fluxo OAuth no browser fechar ao retornar ao app
WebBrowser.maybeCompleteAuthSession();

/**
 * Extrai access_token e refresh_token da URL de redirect do OAuth (hash # ou query ?).
 * Supabase envia os tokens no fragmento da URL após o login social.
 */
function parseSessionFromUrl(url: string): { access_token?: string; refresh_token?: string; error?: string } {
  try {
    const hashIdx = url.indexOf('#');
    const queryIdx = url.indexOf('?');
    const fragment = hashIdx >= 0 ? url.substring(hashIdx + 1) : '';
    const query = queryIdx >= 0 ? url.substring(queryIdx + 1) : '';
    const paramsStr = fragment || query;
    if (!paramsStr) return {};
    const params = new URLSearchParams(paramsStr);
    const error = params.get('error_description') || params.get('error') || undefined;
    return {
      access_token: params.get('access_token') || undefined,
      refresh_token: params.get('refresh_token') || undefined,
      error,
    };
  } catch {
    return {};
  }
}

/**
 * Cria sessão no Supabase a partir da URL de callback do OAuth (após Google/Microsoft).
 */
async function createSessionFromUrl(url: string): Promise<void> {
  const { access_token, refresh_token, error } = parseSessionFromUrl(url);
  if (error) throw new Error(error);
  if (!access_token || !refresh_token) return;
  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Carregar preferências de "Lembrar de mim"
  useEffect(() => {
    const loadRememberedLogin = async () => {
      try {
        const [rememberValue, rememberedEmail] = await Promise.all([
          AsyncStorage.getItem('@telos_remember_me'),
          AsyncStorage.getItem('@telos_remembered_email'),
        ]);

        if (rememberValue === 'true' && rememberedEmail) {
          setRememberMe(true);
          setEmail(rememberedEmail);
        }
      } catch (err) {
        console.warn('Erro ao carregar preferências de login:', err);
      }
    };

    loadRememberedLogin();
  }, []);

  // Função para validar formato de email
  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleLogin = async () => {
    // Validação: campos obrigatórios
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Validação: formato de email
    if (!validarEmail(email)) {
      setError('Por favor, insira um e-mail válido (exemplo: seu@email.com).');
      return;
    }

    // Validação: senha mínima
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) {
        // Mensagens de erro mais amigáveis e específicas
        let mensagemErro = 'Erro ao fazer login.';
        
        if (authError.message.includes('Invalid login credentials')) {
          mensagemErro = 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.';
        } else if (authError.message.includes('Email not confirmed')) {
          mensagemErro = 'Por favor, confirme seu e-mail antes de fazer login.';
        } else if (authError.message.includes('Too many requests')) {
          mensagemErro = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
        } else if (authError.message.includes('network')) {
          mensagemErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          mensagemErro = authError.message || 'Erro ao fazer login. Tente novamente.';
        }
        
        setError(mensagemErro);
        return;
      }

      if (data.user) {
        console.log('✅ Login bem-sucedido:', data.user.email);

        // Persistir preferência de "Lembrar de mim"
        if (rememberMe) {
          await AsyncStorage.setItem('@telos_remember_me', 'true');
          await AsyncStorage.setItem('@telos_remembered_email', email.trim());
        } else {
          await AsyncStorage.multiRemove(['@telos_remember_me', '@telos_remembered_email']);
        }

        // O redirecionamento é feito automaticamente pelo _layout.tsx
        // após detectar que o usuário está autenticado
      }
    } catch (err) {
      console.error('❌ Erro inesperado no login:', err);
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // URL de retorno para o app (scheme do app.json: 333f). Deve estar em Supabase → Auth → URL Configuration → Redirect URLs
      const redirectTo = Linking.createURL('/');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true, // Abrimos o browser manualmente e tratamos o retorno
        },
      });

      if (oauthError) {
        const mensagemErro =
          oauthError.message.includes('redirect')
            ? 'Configure as URLs de redirecionamento no Supabase (Auth → URL Configuration).'
            : oauthError.message || 'Erro ao iniciar login social.';
        setError(mensagemErro);
        return;
      }

      const authUrl = data?.url;
      if (!authUrl) {
        setError('Não foi possível obter a URL de login. Tente novamente.');
        return;
      }

      // Abre o browser para o usuário fazer login no Google; ao concluir, o app recebe o redirect
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);

      if (result.type === 'success' && result.url) {
        await createSessionFromUrl(result.url);
        // Redirecionamento para (tabs) ocorre automaticamente pelo _layout ao detectar user
      } else if (result.type === 'cancel') {
        setError('Login cancelado.');
      } else if (result.type === 'dismiss') {
        // Usuário fechou o browser sem concluir; não exibir erro se foi intencional
      }
    } catch (err: any) {
      console.error('❌ Erro no login com Google:', err);
      setError(err?.message || 'Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground />
    <KeyboardAvoidingView
        style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Logo e Título */}
            <View style={styles.hero}>
              <Image
                source={TELOS_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <View style={styles.divider} />
              <ThemedText style={styles.subtitle}>Sistema de controle financeiro</ThemedText>
            </View>

            {/* Form Container com Glassmorphism */}
            <GlassContainer style={styles.glassCard}>
              <View style={styles.formContent}>
                {/* Email Input */}
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

                {/* Password Input */}
                <PasswordInput
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              autoComplete="password"
            />

                {/* Remember Me */}
                <TouchableOpacity
                  style={styles.rememberMe}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}>
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <MaterialIcons name="check" size={16} color="#00b09b" />}
                  </View>
                  <Text style={styles.rememberMeText}>Lembrar de mim</Text>
                </TouchableOpacity>

                {/* Error Message */}
                {error && <Text style={styles.error}>{error}</Text>}

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}>
                  {loading ? (
                    <Text style={styles.loginButtonText}>Carregando...</Text>
                  ) : (
                    <Text style={styles.loginButtonText}>Entrar</Text>
                  )}
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Esqueceu sua senha?</Text>
                </TouchableOpacity>

                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>ou continue com</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Login com Google */}
                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleGoogleLogin}
                    activeOpacity={0.7}>
                    <MaterialIcons name="email" size={20} color="#FFFFFF" />
                    <Text style={styles.socialButtonText}>Entrar com Google</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassContainer>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 24,
    gap: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 260,
    height: 100,
    marginBottom: 8,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#00b09b',
    marginVertical: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  glassCard: {
    padding: 24,
  },
  formContent: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
    fontSize: 14,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    color: '#FFFFFF',
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: 'rgba(0, 176, 155, 0.2)',
    borderColor: '#00b09b',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  error: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#00b09b',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#00b09b',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  separatorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
