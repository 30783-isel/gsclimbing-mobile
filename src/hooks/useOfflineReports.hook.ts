/**
 * Hook useOfflineReports
 * Facilita gestão de relatórios offline nos componentes
 */

import { useState, useEffect, useCallback } from 'react';
import { offlineReportsService, OfflineReport } from '@/services/storage/offlineReports.service';
import { reportSyncService, SyncSummary } from '@/services/sync/reportSync.service';
import NetInfo from '@react-native-community/netinfo';

export interface UseOfflineReportsReturn {
  // Estado
  reports: OfflineReport[];
  pendingSync: OfflineReport[];
  editing: OfflineReport[];
  isOnline: boolean;
  isSyncing: boolean;
  counts: {
    total: number;
    editing: number;
    pendingSync: number;
    syncError: number;
  };
  lastSync: Date | null;

  // Ações
  create: (report: Omit<OfflineReport, 'tempId' | 'status' | 'createdAt' | 'lastModified' | 'syncAttempts'>) => Promise<OfflineReport>;
  update: (tempId: string, updates: Partial<OfflineReport>) => Promise<OfflineReport | null>;
  deleteReport: (tempId: string) => Promise<boolean>;
  markForSync: (tempId: string) => Promise<boolean>;
  syncAll: () => Promise<SyncSummary>;
  retryFailed: () => Promise<SyncSummary>;
  refresh: () => Promise<void>;
}

/**
 * Hook para gerir relatórios offline
 */
export function useOfflineReports(): UseOfflineReportsReturn {
  const [reports, setReports] = useState<OfflineReport[]>([]);
  const [pendingSync, setPendingSync] = useState<OfflineReport[]>([]);
  const [editing, setEditing] = useState<OfflineReport[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [counts, setCounts] = useState({
    total: 0,
    editing: 0,
    pendingSync: 0,
    syncError: 0,
  });
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Carregar relatórios
  const loadReports = useCallback(async () => {
    try {
      const [all, pending, edit, countsData, lastSyncData] = await Promise.all([
        offlineReportsService.getAll(),
        offlineReportsService.getPendingSync(),
        offlineReportsService.getEditing(),
        offlineReportsService.getCounts(),
        offlineReportsService.getLastSync(),
      ]);

      setReports(all);
      setPendingSync(pending);
      setEditing(edit);
      setCounts(countsData);
      setLastSync(lastSyncData);
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios offline:', error);
    }
  }, []);

  // Monitorar estado de conexão
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    // Verificar estado inicial
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Monitorar estado de sincronização
  useEffect(() => {
    const checkSyncStatus = () => {
      setIsSyncing(reportSyncService.isCurrentlySyncing);
    };

    const interval = setInterval(checkSyncStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listener de sincronização
  useEffect(() => {
    const removeListener = reportSyncService.addSyncListener((summary) => {
      console.log('🔔 Sincronização concluída:', summary);
      loadReports(); // Recarregar após sync
    });

    return removeListener;
  }, [loadReports]);

  // Carregar ao montar
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Ações
  const create = useCallback(async (report: Omit<OfflineReport, 'tempId' | 'status' | 'createdAt' | 'lastModified' | 'syncAttempts'>) => {
    const newReport = await offlineReportsService.create(report);
    await loadReports();
    return newReport;
  }, [loadReports]);

  const update = useCallback(async (tempId: string, updates: Partial<OfflineReport>) => {
    const updated = await offlineReportsService.update(tempId, updates);
    await loadReports();
    return updated;
  }, [loadReports]);

  const deleteReport = useCallback(async (tempId: string) => {
    const success = await offlineReportsService.delete(tempId);
    await loadReports();
    return success;
  }, [loadReports]);

  const markForSync = useCallback(async (tempId: string) => {
    const success = await offlineReportsService.markForSync(tempId);
    await loadReports();
    return success;
  }, [loadReports]);

  const syncAll = useCallback(async () => {
    const summary = await reportSyncService.syncAll();
    await loadReports();
    return summary;
  }, [loadReports]);

  const retryFailed = useCallback(async () => {
    const summary = await reportSyncService.retryFailed();
    await loadReports();
    return summary;
  }, [loadReports]);

  const refresh = useCallback(async () => {
    await loadReports();
  }, [loadReports]);

  return {
    // Estado
    reports,
    pendingSync,
    editing,
    isOnline,
    isSyncing,
    counts,
    lastSync,

    // Ações
    create,
    update,
    deleteReport,
    markForSync,
    syncAll,
    retryFailed,
    refresh,
  };
}
