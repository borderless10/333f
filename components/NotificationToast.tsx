import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  backgroundColor: string;
  iconColor: string;
  iconName: string;
  borderColor: string;
}

const toastConfigs: Record<ToastType, ToastConfig> = {
  success: {
    backgroundColor: 'rgba(0, 176, 155, 0.25)',
    iconColor: '#00b09b',
    iconName: 'checkmark.circle.fill',
    borderColor: '#00b09b',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    iconColor: '#EF4444',
    iconName: 'xmark.circle.fill',
    borderColor: '#EF4444',
  },
  warning: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    iconColor: '#FBBF24',
    iconName: 'exclamationmark.triangle.fill',
    borderColor: '#FBBF24',
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    iconColor: '#3B82F6',
    iconName: 'info.circle.fill',
    borderColor: '#3B82F6',
  },
};

const CustomToast = ({ type, text1, text2, onPress, props }: any) => {
  const config = toastConfigs[type as ToastType] || toastConfigs.info;
  
  // Extrair transactionType de props
  const transactionType = props?.transactionType;
  
  // Determinar mensagem principal e se há título
  // Prioridade: text2 (mensagem) > text1 (título ou mensagem)
  // Se text2 não existir mas text1 existir, usar text1 como mensagem
  const mainMessage = text2 || text1;
  const hasTitle = Boolean(text1 && text2 && text1 !== text2); // Mostrar título apenas se ambos existirem e forem diferentes

  // Se for uma notificação de transação, usar ícone e cores específicas
  const isTransaction = transactionType === 'receita' || transactionType === 'despesa';
  // Usar ícones de seta: receita = seta para cima, despesa = seta para cima (ambas para cima)
  const transactionIcon = 'arrow.up.circle.fill';
  const transactionColor = transactionType === 'receita' ? '#10B981' : '#EF4444';
  const transactionBg = transactionType === 'receita' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';

  const iconName = isTransaction ? transactionIcon : config.iconName;
  const iconColor = isTransaction ? transactionColor : config.iconColor;
  const iconBg = isTransaction ? transactionBg : config.backgroundColor;
  const borderColor = isTransaction ? transactionColor : config.borderColor;

  const BlurWrapper = Platform.OS === 'web' ? View : BlurView;
  const blurProps = Platform.OS === 'web' ? {} : { intensity: 80, tint: 'dark' as const };

  return (
    <View style={styles.container}>
      <BlurWrapper {...blurProps} style={styles.blurContainer}>
        <LinearGradient
          colors={['rgba(0, 26, 46, 0.95)', 'rgba(0, 21, 38, 0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderLeftColor: borderColor }]}>
          <View style={styles.content} pointerEvents="box-none">
            <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
              <IconSymbol name={iconName as any} size={22} color={iconColor} />
            </View>
            <View style={styles.textContainer}>
              {hasTitle && text1 && (
                <Text style={styles.text1} numberOfLines={1} ellipsizeMode="tail">
                  {text1}
                </Text>
              )}
              <Text 
                style={styles.text2} 
                numberOfLines={3}
                ellipsizeMode="tail"
                allowFontScaling={true}>
                {mainMessage ? String(mainMessage) : ''}
              </Text>
            </View>
            {onPress && (
              <TouchableOpacity onPress={onPress} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark" size={16} color="rgba(255, 255, 255, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </BlurWrapper>
    </View>
  );
};

export const toastConfig = {
  success: (props: any) => <CustomToast {...props} type="success" />,
  error: (props: any) => <CustomToast {...props} type="error" />,
  warning: (props: any) => <CustomToast {...props} type="warning" />,
  info: (props: any) => <CustomToast {...props} type="info" />,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 9999,
    elevation: 9999, // Para Android
    width: '100%',
    maxWidth: '100%',
  },
  blurContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Para Android
    marginHorizontal: 0,
    width: '100%',
  },
  gradient: {
    borderRadius: 14,
    borderLeftWidth: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0, // Permite que o texto seja truncado
    marginRight: 8,
    justifyContent: 'center', // Centraliza verticalmente o conteúdo
    paddingRight: Platform.OS === 'ios' ? 4 : 0, // Pequeno ajuste para iOS
  },
  text1: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  text2: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 20,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  closeButton: {
    padding: 6,
    marginLeft: 4,
    flexShrink: 0,
  },
});
