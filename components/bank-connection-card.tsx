import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassContainer } from './glass-container';
import { IconSymbol } from './ui/icon-symbol';
import { BankConnection, ConnectionStatus } from '@/lib/services/bank-integrations';

interface BankConnectionCardProps {
  connection: BankConnection;
  onPress?: () => void;
  onSync?: () => void;
  onDisconnect?: () => void;
}

export function BankConnectionCard({
  connection,
  onPress,
  onSync,
  onDisconnect,
}: BankConnectionCardProps) {
  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'expired':
        return '#F59E0B';
      case 'error':
        return '#EF4444';
      case 'pending':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: ConnectionStatus) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'expired':
        return 'Expirada';
      case 'error':
        return 'Erro';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconhecido';
    }
  };

  const formatAccountNumber = (account: string) => {
    // Ocultar parte do número da conta por segurança
    if (account.length > 4) {
      return `****${account.slice(-4)}`;
    }
    return account;
  };

  return (
    <GlassContainer style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.bankInfo}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(connection.status) }]} />
            <View style={styles.bankDetails}>
              <Text style={styles.bankName}>{connection.bankName}</Text>
              <Text style={styles.accountInfo}>
                {connection.accountType === 'checking' ? 'Conta Corrente' : 
                 connection.accountType === 'savings' ? 'Poupança' : 'Investimento'} • {formatAccountNumber(connection.accountNumber)}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(connection.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(connection.status) }]}>
              {getStatusText(connection.status)}
            </Text>
          </View>
        </View>

        {connection.lastSyncAt && (
          <View style={styles.syncInfo}>
            <IconSymbol name="clock" size={12} color="rgba(255, 255, 255, 0.6)" />
            <Text style={styles.syncText}>
              Última sincronização: {new Date(connection.lastSyncAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {connection.status === 'active' && onSync && (
            <TouchableOpacity style={styles.actionButton} onPress={onSync}>
              <IconSymbol name="arrow.clockwise" size={16} color="#00b09b" />
              <Text style={styles.actionText}>Sincronizar</Text>
            </TouchableOpacity>
          )}
          {onDisconnect && (
            <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={onDisconnect}>
              <IconSymbol name="xmark.circle.fill" size={16} color="#EF4444" />
              <Text style={[styles.actionText, styles.dangerText]}>Desconectar</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </GlassContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bankInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  bankDetails: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  accountInfo: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  syncText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 176, 155, 0.1)',
    gap: 6,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00b09b',
  },
  dangerText: {
    color: '#EF4444',
  },
});
