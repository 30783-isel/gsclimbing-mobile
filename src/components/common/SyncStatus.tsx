import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, Portal, Dialog, Button } from 'react-native-paper';
import { useSync } from '@/hooks/useSync';
import { colors, spacing } from '@/constants/theme';

export const SyncStatus: React.FC = () => {
  const { isOnline, isSyncing, queueSize, lastSync, syncNow } = useSync();
  const [dialogVisible, setDialogVisible] = React.useState(false);

  const getStatusColor = () => {
    if (!isOnline) return colors.error;
    if (isSyncing) return colors.warning;
    if (queueSize > 0) return colors.warning;
    return colors.success;
  };

  const getStatusIcon = () => {
    if (!isOnline) return 'wifi-off';
    if (isSyncing) return 'sync';
    if (queueSize > 0) return 'cloud-upload';
    return 'cloud-check';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isSyncing) return 'A sincronizar...';
    if (queueSize > 0) return `${queueSize} pendente${queueSize > 1 ? 's' : ''}`;
    return 'Sincronizado';
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes === 1) return 'Há 1 minuto';
    if (minutes < 60) return `Há ${minutes} minutos`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Há 1 hora';
    if (hours < 24) return `Há ${hours} horas`;
    
    return lastSync.toLocaleDateString('pt-PT');
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, { backgroundColor: getStatusColor() + '20' }]}
        onPress={() => setDialogVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <IconButton
            icon={getStatusIcon()}
            size={16}
            iconColor={getStatusColor()}
            style={styles.icon}
            animated
          />
          <Text style={[styles.text, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Sync Details Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>Estado de Sincronização</Dialog.Title>
          <Dialog.Content>
            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Estado:</Text>
              <View style={styles.dialogValue}>
                <IconButton
                  icon={getStatusIcon()}
                  size={20}
                  iconColor={getStatusColor()}
                  style={styles.dialogIcon}
                />
                <Text style={[styles.dialogText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Conexão:</Text>
              <Text style={styles.dialogText}>
                {isOnline ? '🟢 Online' : '🔴 Offline'}
              </Text>
            </View>

            {queueSize > 0 && (
              <View style={styles.dialogRow}>
                <Text style={styles.dialogLabel}>Pendentes:</Text>
                <Text style={[styles.dialogText, { color: colors.warning }]}>
                  {queueSize} {queueSize === 1 ? 'item' : 'itens'}
                </Text>
              </View>
            )}

            <View style={styles.dialogRow}>
              <Text style={styles.dialogLabel}>Última Sync:</Text>
              <Text style={styles.dialogText}>{formatLastSync()}</Text>
            </View>

            {!isOnline && (
              <View style={styles.offlineWarning}>
                <Text style={styles.offlineText}>
                  📵 Modo Offline ativo. Os dados serão sincronizados automaticamente quando houver conexão.
                </Text>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            {isOnline && queueSize > 0 && (
              <Button
                onPress={() => {
                  syncNow();
                  setDialogVisible(false);
                }}
                disabled={isSyncing}
              >
                Sincronizar Agora
              </Button>
            )}
            <Button onPress={() => setDialogVisible(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  icon: {
    margin: 0,
    width: 20,
    height: 20,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  dialogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dialogLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  dialogValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dialogIcon: {
    margin: 0,
  },
  dialogText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  offlineWarning: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warning + '20',
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
  },
});