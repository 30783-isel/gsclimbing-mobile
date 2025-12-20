/**
 * OfflineSyncIndicator
 * Indicador visual do estado de conexão e sincronização
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text, IconButton, ProgressBar, Chip } from 'react-native-paper';
import { colors, spacing } from '@/constants/theme';
import { useOfflineReports } from '@/hooks/useOfflineReports.hook';

interface OfflineSyncIndicatorProps {
  onSyncPress?: () => void;
  compact?: boolean;
}

export function OfflineSyncIndicator({ 
  onSyncPress, 
  compact = false 
}: OfflineSyncIndicatorProps) {
  const {
    isOnline,
    isSyncing,
    counts,
    lastSync,
    syncAll,
  } = useOfflineReports();

  // Não mostrar se está online e não há nada pendente
  if (isOnline && counts.pendingSync === 0 && counts.syncError === 0) {
    return null;
  }

  const handleSync = () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      syncAll();
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {!isOnline && (
          <Chip
            icon="wifi-off"
            mode="flat"
            style={styles.offlineChip}
            textStyle={styles.chipText}
          >
            Offline
          </Chip>
        )}
        
        {counts.pendingSync > 0 && (
          <Chip
            icon="cloud-upload"
            mode="flat"
            style={styles.pendingChip}
            textStyle={styles.chipText}
            onPress={isOnline ? handleSync : undefined}
          >
            {counts.pendingSync} pendente{counts.pendingSync > 1 ? 's' : ''}
          </Chip>
        )}
        
        {counts.syncError > 0 && (
          <Chip
            icon="alert-circle"
            mode="flat"
            style={styles.errorChip}
            textStyle={styles.chipText}
            onPress={handleSync}
          >
            {counts.syncError} erro{counts.syncError > 1 ? 's' : ''}
          </Chip>
        )}
      </View>
    );
  }

  return (
    <Surface style={styles.container} elevation={1}>
      <View style={styles.header}>
        <View style={styles.statusContainer}>
          {/* Estado de conexão */}
          <View style={[
            styles.statusDot,
            isOnline ? styles.onlineDot : styles.offlineDot
          ]} />
          <Text style={styles.statusText}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>

        {/* Botão de sincronização */}
        {isOnline && counts.pendingSync > 0 && (
          <IconButton
            icon={isSyncing ? "sync" : "cloud-upload"}
            size={20}
            onPress={handleSync}
            disabled={isSyncing}
            iconColor={colors.primary}
            style={isSyncing ? styles.syncingButton : undefined}
          />
        )}
      </View>

      {/* Barra de progresso durante sincronização */}
      {isSyncing && (
        <View style={styles.progressContainer}>
          <ProgressBar
            indeterminate
            color={colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>
            A sincronizar...
          </Text>
        </View>
      )}

      {/* Informações de relatórios */}
      {!isSyncing && (
        <View style={styles.infoContainer}>
          {counts.pendingSync > 0 && (
            <Text style={styles.infoText}>
              📤 {counts.pendingSync} relatório{counts.pendingSync > 1 ? 's' : ''} por sincronizar
            </Text>
          )}
          
          {counts.syncError > 0 && (
            <Text style={[styles.infoText, styles.errorText]}>
              ⚠️ {counts.syncError} com erro de sincronização
            </Text>
          )}
          
          {counts.editing > 0 && (
            <Text style={styles.infoText}>
              ✏️ {counts.editing} em edição
            </Text>
          )}

          {lastSync && counts.pendingSync === 0 && counts.syncError === 0 && (
            <Text style={styles.lastSyncText}>
              Última sincronização: {formatLastSync(lastSync)}
            </Text>
          )}
        </View>
      )}
    </Surface>
  );
}

// Helper para formatar data da última sincronização
function formatLastSync(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'agora mesmo';
  if (minutes === 1) return 'há 1 minuto';
  if (minutes < 60) return `há ${minutes} minutos`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return 'há 1 hora';
  if (hours < 24) return `há ${hours} horas`;
  
  const days = Math.floor(hours / 24);
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  compactContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineDot: {
    backgroundColor: colors.success,
  },
  offlineDot: {
    backgroundColor: colors.error,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  syncingButton: {
    // Animação de rotação poderia ser adicionada aqui
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoContainer: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
  },
  lastSyncText: {
    fontSize: 11,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  offlineChip: {
    backgroundColor: colors.error + '20',
  },
  pendingChip: {
    backgroundColor: colors.warning + '20',
  },
  errorChip: {
    backgroundColor: colors.error + '20',
  },
  chipText: {
    fontSize: 12,
  },
});
