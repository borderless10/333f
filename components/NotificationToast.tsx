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
  
  // Extrair transactionType, iconType, userRole e customIcon de props
  const transactionType = props?.transactionType;
  const iconType = props?.iconType;
  const userRole = props?.userRole;
  const customIcon = props?.customIcon;
  
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

  // Se for uma notificação de empresa, usar ícone de empresa
  const isCompany = iconType === 'company';
  const companyIcon = 'building.columns.fill';
  const companyColor = '#00b09b';
  const companyBg = 'rgba(0, 176, 155, 0.25)';

  // Se for uma notificação de usuário, usar ícone de usuário
  const isUser = iconType === 'user';
  const userIcon = 'person.crop.circle.fill';
  // Cores baseadas no cargo: azul para analista, amarelo para visualizador, vermelho para administrador
  let userColor = '#6366F1'; // padrão azul
  let userBg = 'rgba(99, 102, 241, 0.25)';
  if (userRole === 'admin') {
    userColor = '#EF4444'; // vermelho
    userBg = 'rgba(239, 68, 68, 0.25)';
  } else if (userRole === 'analista') {
    userColor = '#3B82F6'; // azul
    userBg = 'rgba(59, 130, 246, 0.25)';
  } else if (userRole === 'viewer') {
    userColor = '#FBBF24'; // amarelo
    userBg = 'rgba(251, 191, 36, 0.25)';
  }

  // Se for uma notificação de título/conta a pagar/receber
  const isTitle = iconType === 'title';
  const titleIcon = 'creditcard';
  const titleColor = '#00b09b';
  const titleBg = 'rgba(0, 176, 155, 0.25)';

  // Se for uma notificação de conta bancária
  const isAccount = iconType === 'account';
  const accountIcon = 'building.columns.fill';
  const accountColor = '#00b09b';
  const accountBg = 'rgba(0, 176, 155, 0.25)';

  // Se for uma notificação de conexão/link
  const isLink = iconType === 'link';
  const linkIcon = 'link.circle.fill';
  const linkColor = '#00b09b';
  const linkBg = 'rgba(0, 176, 155, 0.25)';

  // Se for uma notificação de empresas de usuário
  const isUserCompany = iconType === 'user_company';
  const userCompanyIcon = 'building.2.fill';
  const userCompanyColor = '#8B5CF6';
  const userCompanyBg = 'rgba(139, 92, 246, 0.25)';

  // Se for uma notificação de conciliação
  const isReconciliation = iconType === 'reconciliation';
  const reconciliationIcon = 'checkmark.circle.fill';
  const reconciliationColor = '#10B981';
  const reconciliationBg = 'rgba(16, 185, 129, 0.25)';

  // Se for uma notificação de match automático
  const isAutoMatch = iconType === 'auto_match';
  const autoMatchIcon = 'sparkles';
  const autoMatchColor = '#8B5CF6';
  const autoMatchBg = 'rgba(139, 92, 246, 0.25)';

  // Se for uma notificação de exportação
  const isExport = iconType === 'export';
  const exportIcon = 'square.and.arrow.up.fill';
  const exportColor = '#00b09b';
  const exportBg = 'rgba(0, 176, 155, 0.25)';

  let iconName = customIcon || config.iconName; // Usar ícone customizado se fornecido
  let iconColor = config.iconColor;
  let iconBg = config.backgroundColor;
  let borderColor = config.borderColor;

  if (isTransaction) {
    iconName = transactionIcon;
    iconColor = transactionColor;
    iconBg = transactionBg;
    borderColor = transactionColor;
  } else if (isCompany) {
    iconName = companyIcon;
    iconColor = companyColor;
    iconBg = companyBg;
    borderColor = companyColor;
  } else if (isUser) {
    iconName = userIcon;
    iconColor = userColor;
    iconBg = userBg;
    borderColor = userColor;
  } else if (isTitle) {
    iconName = titleIcon;
    iconColor = titleColor;
    iconBg = titleBg;
    borderColor = titleColor;
  } else if (isAccount) {
    iconName = accountIcon;
    iconColor = accountColor;
    iconBg = accountBg;
    borderColor = accountColor;
  } else if (isLink) {
    iconName = linkIcon;
    iconColor = linkColor;
    iconBg = linkBg;
    borderColor = linkColor;
  } else if (isUserCompany) {
    iconName = userCompanyIcon;
    iconColor = userCompanyColor;
    iconBg = userCompanyBg;
    borderColor = userCompanyColor;
  } else if (isReconciliation) {
    iconName = reconciliationIcon;
    iconColor = reconciliationColor;
    iconBg = reconciliationBg;
    borderColor = reconciliationColor;
  } else if (isAutoMatch) {
    iconName = autoMatchIcon;
    iconColor = autoMatchColor;
    iconBg = autoMatchBg;
    borderColor = autoMatchColor;
  } else if (isExport) {
    iconName = exportIcon;
    iconColor = exportColor;
    iconBg = exportBg;
    borderColor = exportColor;
  }

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
