import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

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
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Login bem-sucedido:', data.user.email);
        // O redirecionamento é feito automaticamente pelo _layout.tsx
        // após detectar que o usuário está autenticado
      }
    } catch (err) {
      console.error('❌ Erro inesperado no login:', err);
      setError('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'microsoft') => {
    console.log(`Login com ${provider}`);
    // Implementar login social depois
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
              <View style={styles.logoContainer}>
                <MaterialIcons name="apartment" size={40} color="#00b09b" style={styles.logoIcon} />
            <ThemedText type="title" style={styles.logo}>
              Télos Control
            </ThemedText>
              </View>
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

                {/* Social Login Buttons */}
                <View style={styles.socialButtons}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('google')}
                    activeOpacity={0.7}>
                    <MaterialIcons name="email" size={20} color="#FFFFFF" />
                    <Text style={styles.socialButtonText}>Google</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => handleSocialLogin('microsoft')}
                    activeOpacity={0.7}>
                    <View style={styles.microsoftLogo}>
                      <View style={[styles.microsoftSquare, { backgroundColor: '#F25022' }]} />
                      <View style={[styles.microsoftSquare, { backgroundColor: '#7FBA00' }]} />
                      <View style={[styles.microsoftSquare, { backgroundColor: '#00A4EF' }]} />
                      <View style={[styles.microsoftSquare, { backgroundColor: '#FFB900' }]} />
                    </View>
                    <Text style={styles.socialButtonText}>Microsoft</Text>
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    // Ícone de prédio já tem tamanho definido no MaterialIcons
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
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
  microsoftLogo: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  microsoftSquare: {
    width: 9,
    height: 9,
    margin: 0.5,
  },
});
