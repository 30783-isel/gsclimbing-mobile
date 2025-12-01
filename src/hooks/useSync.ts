import { useEffect } from 'react';
import { syncService } from '@/services/storage/syncService';
import { useSyncStore } from '@/store/syncStore';

export const useSync = () => {
  const syncState = useSyncStore();

  useEffect(() => {
    // Inicializar serviço de sincronização
    syncService.initialize();

    // Subscrever a mudanças de estado
    const unsubscribe = syncService.subscribe((state) => {
      syncState.updateState(state);
    });

    // Atualizar estado inicial
    syncService.getState().then((state) => {
      syncState.updateState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...syncState,
    syncNow: () => syncService.syncNow(),
    forceSyncAll: () => syncService.forceSyncAll(),
    clearOfflineData: () => syncService.clearOfflineData(),
  };
};