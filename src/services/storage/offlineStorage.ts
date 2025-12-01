import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Chaves de armazenamento
 */
const KEYS = {
  PROJECTS: '@gsclimbing:projects',
  TURBINES: '@gsclimbing:turbines',
  REPORTS: '@gsclimbing:reports',
  PHOTOS: '@gsclimbing:photos',
  SYNC_QUEUE: '@gsclimbing:sync_queue',
  LAST_SYNC: '@gsclimbing:last_sync',
};

/**
 * Item da queue de sincronização
 */
export interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'project' | 'turbine' | 'report' | 'photo';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

/**
 * Serviço de armazenamento offline
 */
export const offlineStorage = {
  /**
   * Guardar dados localmente
   */
  async save<T>(key: string, data: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(data);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ Saved to offline storage: ${key}`);
    } catch (error) {
      console.error('Error saving to offline storage:', error);
      throw error;
    }
  },

  /**
   * Obter dados locais
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting from offline storage:', error);
      return null;
    }
  },

  /**
   * Remover dados locais
   */
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ Removed from offline storage: ${key}`);
    } catch (error) {
      console.error('Error removing from offline storage:', error);
      throw error;
    }
  },

  /**
   * Limpar todo o cache
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
      console.log('🧹 Cleared all offline storage');
    } catch (error) {
      console.error('Error clearing offline storage:', error);
      throw error;
    }
  },

  /**
   * Guardar projetos offline
   */
  async saveProjects(projects: any[]): Promise<void> {
    await this.save(KEYS.PROJECTS, projects);
  },

  /**
   * Obter projetos offline
   */
  async getProjects(): Promise<any[]> {
    return (await this.get(KEYS.PROJECTS)) || [];
  },

  /**
   * Guardar turbinas offline
   */
  async saveTurbines(turbines: any[]): Promise<void> {
    await this.save(KEYS.TURBINES, turbines);
  },

  /**
   * Obter turbinas offline
   */
  async getTurbines(): Promise<any[]> {
    return (await this.get(KEYS.TURBINES)) || [];
  },

  /**
   * Guardar relatórios offline
   */
  async saveReports(reports: any[]): Promise<void> {
    await this.save(KEYS.REPORTS, reports);
  },

  /**
   * Obter relatórios offline
   */
  async getReports(): Promise<any[]> {
    return (await this.get(KEYS.REPORTS)) || [];
  },

  /**
   * Adicionar item à queue de sincronização
   */
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const newItem: SyncQueueItem = {
        ...item,
        id: Date.now().toString(),
        timestamp: Date.now(),
        retries: 0,
      };
      queue.push(newItem);
      await this.save(KEYS.SYNC_QUEUE, queue);
      console.log(`📤 Added to sync queue: ${item.entity} ${item.type}`);
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  },

  /**
   * Obter queue de sincronização
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return (await this.get(KEYS.SYNC_QUEUE)) || [];
  },

  /**
   * Remover item da queue
   */
  async removeFromSyncQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.filter((item) => item.id !== itemId);
      await this.save(KEYS.SYNC_QUEUE, updatedQueue);
      console.log(`✅ Removed from sync queue: ${itemId}`);
    } catch (error) {
      console.error('Error removing from sync queue:', error);
      throw error;
    }
  },

  /**
   * Atualizar item da queue (incrementar retries, erro)
   */
  async updateSyncQueueItem(itemId: string, updates: Partial<SyncQueueItem>): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const updatedQueue = queue.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      await this.save(KEYS.SYNC_QUEUE, updatedQueue);
    } catch (error) {
      console.error('Error updating sync queue item:', error);
      throw error;
    }
  },

  /**
   * Limpar queue de sincronização
   */
  async clearSyncQueue(): Promise<void> {
    await this.save(KEYS.SYNC_QUEUE, []);
    console.log('🧹 Cleared sync queue');
  },

  /**
   * Guardar última data de sincronização
   */
  async saveLastSync(date: Date = new Date()): Promise<void> {
    await this.save(KEYS.LAST_SYNC, date.toISOString());
  },

  /**
   * Obter última data de sincronização
   */
  async getLastSync(): Promise<Date | null> {
    const dateStr = await this.get<string>(KEYS.LAST_SYNC);
    return dateStr ? new Date(dateStr) : null;
  },

  /**
   * Obter estatísticas de armazenamento
   */
  async getStorageStats(): Promise<{
    projects: number;
    turbines: number;
    reports: number;
    syncQueue: number;
  }> {
    const [projects, turbines, reports, syncQueue] = await Promise.all([
      this.getProjects(),
      this.getTurbines(),
      this.getReports(),
      this.getSyncQueue(),
    ]);

    return {
      projects: projects.length,
      turbines: turbines.length,
      reports: reports.length,
      syncQueue: syncQueue.length,
    };
  },
};