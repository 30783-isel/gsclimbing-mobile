import NetInfo from '@react-native-community/netinfo';
import { offlineStorage, SyncQueueItem } from './offlineStorage';
import { projectsAPI } from '../api/projects.api';
import Toast from 'react-native-toast-message';

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30000; // 30 segundos

/**
 * Estado de sincronização
 */
export interface SyncState {
  isSyncing: boolean;
  isOnline: boolean;
  queueSize: number;
  lastSync: Date | null;
  errors: string[];
}

/**
 * Callbacks de sincronização
 */
type SyncCallback = (state: SyncState) => void;

/**
 * Serviço de sincronização
 */
class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private callbacks: Set<SyncCallback> = new Set();

  /**
   * Inicializar serviço
   */
  async initialize(): Promise<void> {
    console.log('🔄 Initializing Sync Service...');

    // Monitorar conexão
    NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      console.log(`📡 Network status: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}`);

      // Se voltou online, sincronizar
      if (!wasOnline && this.isOnline) {
        console.log('✅ Back online! Starting sync...');
        this.syncNow();
      }

      this.notifyCallbacks();
    });

    // Verificar conexão inicial
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected === true;

    // Iniciar sincronização periódica
    this.startPeriodicSync();

    // Sincronizar imediatamente se online
    if (this.isOnline) {
      await this.syncNow();
    }
  }

  /**
   * Adicionar callback de mudança de estado
   */
  subscribe(callback: SyncCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notificar callbacks
   */
  private async notifyCallbacks(): Promise<void> {
    const state = await this.getState();
    this.callbacks.forEach((callback) => callback(state));
  }

  /**
   * Obter estado atual
   */
  async getState(): Promise<SyncState> {
    const queue = await offlineStorage.getSyncQueue();
    const lastSync = await offlineStorage.getLastSync();

    return {
      isSyncing: this.isSyncing,
      isOnline: this.isOnline,
      queueSize: queue.length,
      lastSync,
      errors: queue.filter((item) => item.error).map((item) => item.error!),
    };
  }

  /**
   * Iniciar sincronização periódica
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, SYNC_INTERVAL);

    console.log(`⏰ Periodic sync started (every ${SYNC_INTERVAL / 1000}s)`);
  }

  /**
   * Parar sincronização periódica
   */
  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏸️ Periodic sync stopped');
    }
  }

  /**
   * Sincronizar agora
   */
  async syncNow(): Promise<void> {
    if (!this.isOnline) {
      console.log('📵 Cannot sync: offline');
      return;
    }

    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return;
    }

    this.isSyncing = true;
    this.notifyCallbacks();

    try {
      console.log('🔄 Starting sync...');

      const queue = await offlineStorage.getSyncQueue();
      console.log(`📤 Sync queue size: ${queue.length}`);

      if (queue.length === 0) {
        console.log('✅ Nothing to sync');
        await offlineStorage.saveLastSync();
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Processar cada item da queue
      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeFromSyncQueue(item.id);
          successCount++;
          console.log(`✅ Synced: ${item.entity} ${item.type}`);
        } catch (error: any) {
          errorCount++;
          console.error(`❌ Sync error for ${item.entity}:`, error);

          // Incrementar retries
          const newRetries = item.retries + 1;

          if (newRetries >= MAX_RETRIES) {
            // Remover da queue após max retries
            await offlineStorage.removeFromSyncQueue(item.id);
            console.log(`🗑️ Removed after ${MAX_RETRIES} retries`);
          } else {
            // Atualizar com erro e retry count
            await offlineStorage.updateSyncQueueItem(item.id, {
              retries: newRetries,
              error: error.message,
            });
          }
        }
      }

      console.log(`🎉 Sync complete: ${successCount} success, ${errorCount} errors`);

      if (successCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Sincronização',
          text2: `${successCount} ${successCount === 1 ? 'item' : 'itens'} sincronizado${successCount === 1 ? '' : 's'}`,
        });
      }

      if (errorCount === 0) {
        await offlineStorage.saveLastSync();
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro na Sincronização',
        text2: 'Tente novamente mais tarde',
      });
    } finally {
      this.isSyncing = false;
      this.notifyCallbacks();
    }
  }

  /**
   * Processar um item da queue
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    switch (item.entity) {
      case 'project':
        return this.syncProject(item);
      case 'turbine':
        return this.syncTurbine(item);
      case 'report':
        return this.syncReport(item);
      case 'photo':
        return this.syncPhoto(item);
      default:
        throw new Error(`Unknown entity type: ${item.entity}`);
    }
  }

  /**
   * Sincronizar projeto
   */
  private async syncProject(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'create':
        await projectsAPI.create(item.data);
        break;
      case 'update':
        await projectsAPI.update(item.data.idProject, item.data);
        break;
      case 'delete':
        await projectsAPI.delete(item.data.name);
        break;
    }
  }

  /**
   * Sincronizar turbina
   */
  private async syncTurbine(item: SyncQueueItem): Promise<void> {
    // TODO: Implementar sincronização de turbinas
    console.log('Syncing turbine:', item);
  }

  /**
   * Sincronizar relatório
   */
  private async syncReport(item: SyncQueueItem): Promise<void> {
    // TODO: Implementar sincronização de relatórios
    console.log('Syncing report:', item);
  }

  /**
   * Sincronizar foto
   */
  private async syncPhoto(item: SyncQueueItem): Promise<void> {
    // TODO: Implementar upload de fotos
    console.log('Syncing photo:', item);
  }

  /**
   * Forçar sincronização manual
   */
  async forceSyncAll(): Promise<void> {
    Toast.show({
      type: 'info',
      text1: 'Sincronização',
      text2: 'A sincronizar dados...',
    });

    await this.syncNow();
  }

  /**
   * Limpar todos os dados offline
   */
  async clearOfflineData(): Promise<void> {
    await offlineStorage.clearAll();
    console.log('🧹 Cleared all offline data');
    Toast.show({
      type: 'success',
      text1: 'Sucesso',
      text2: 'Dados offline eliminados',
    });
  }
}

// Exportar instância única
export const syncService = new SyncService();