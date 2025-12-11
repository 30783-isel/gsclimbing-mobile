/**
 * SyncDebugOverlay.tsx
 * Overlay de debug que mostra logs de sincronização DENTRO da app
 * Para quando o VS Code perde conexão ao desligar WiFi
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { IconButton, FAB } from 'react-native-paper';
import { reportSyncService } from '@/services/sync/reportSync.service';
import NetInfo from '@react-native-community/netinfo';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export const SyncDebugOverlay: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Adicionar log
  const addLog = (type: LogEntry['type'], message: string) => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    
    setLogs(prev => [...prev, newLog]);
    
    // Auto-scroll para o fim
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Monitor conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const nowOnline = state.isConnected ?? false;
      
      setIsOnline(nowOnline);
      
      if (!wasOnline && nowOnline) {
        addLog('success', '🌐 VOLTOU ONLINE!');
      } else if (wasOnline && !nowOnline) {
        addLog('warning', '📵 FICOU OFFLINE');
      }
    });

    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
      addLog('info', `📡 Estado inicial: ${state.isConnected ? 'ONLINE' : 'OFFLINE'}`);
    });

    return unsubscribe;
  }, [isOnline]);

  // Monitor logs do service
  useEffect(() => {
    const removeLogListener = reportSyncService.addLogCallback((type, message) => {
      addLog(type, message);
    });

    return removeLogListener;
  }, []);

  // Monitor sincronização
  useEffect(() => {
    const removeListener = reportSyncService.addSyncListener((summary) => {
      setIsSyncing(false);
    });

    return removeListener;
  }, []);

  // Sincronizar manualmente
  const handleSync = async () => {
    addLog('info', '🔄 Iniciando sincronização MANUAL...');
    setIsSyncing(true);
    
    try {
      const summary = await reportSyncService.syncAll();
      addLog('success', `✅ Sincronização completa: ${summary.succeeded}/${summary.total}`);
    } catch (error: any) {
      addLog('error', `❌ Erro: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Limpar logs
  const handleClear = () => {
    setLogs([]);
    addLog('info', '🗑️ Logs limpos');
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      default: return '#2196F3';
    }
  };

  return (
    <>
      {/* FAB para abrir overlay */}
      <FAB
        icon="bug"
        style={styles.fab}
        onPress={() => setVisible(true)}
        label="Debug"
        small
      />

      {/* Modal com logs */}
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🐛 Sync Debug</Text>
            <View style={styles.headerButtons}>
              <IconButton
                icon="refresh"
                size={24}
                onPress={handleClear}
              />
              <IconButton
                icon="close"
                size={24}
                onPress={() => setVisible(false)}
              />
            </View>
          </View>

          {/* Status */}
          <View style={styles.statusBar}>
            <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
              <Text style={styles.statusText}>
                {isOnline ? '🌐 ONLINE' : '📵 OFFLINE'}
              </Text>
            </View>
            
            {isSyncing && (
              <View style={[styles.statusBadge, { backgroundColor: '#FF9800' }]}>
                <Text style={styles.statusText}>⏳ Sincronizando...</Text>
              </View>
            )}
          </View>

          {/* Botão Sincronizar */}
          <TouchableOpacity
            style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={!isOnline || isSyncing}
          >
            <Text style={styles.syncButtonText}>
              {isSyncing ? '⏳ A Sincronizar...' : '🔄 SINCRONIZAR AGORA'}
            </Text>
          </TouchableOpacity>

          {/* Logs */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.logsContainer}
            contentContainerStyle={styles.logsContent}
          >
            {logs.length === 0 ? (
              <Text style={styles.emptyText}>Sem logs ainda...</Text>
            ) : (
              logs.map((log, index) => (
                <View key={index} style={styles.logEntry}>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                  <Text style={[styles.logMessage, { color: getLogColor(log.type) }]}>
                    {log.message}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#FF9800',
  },
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  statusBar: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#2D2D2D',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  syncButton: {
    margin: 12,
    padding: 16,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    backgroundColor: '#555555',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    flex: 1,
  },
  logsContent: {
    padding: 12,
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  logEntry: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#2D2D2D',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#888888',
    marginBottom: 4,
  },
  logMessage: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#FFFFFF',
  },
});