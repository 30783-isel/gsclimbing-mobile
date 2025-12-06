/**
 * Offline Reports Storage Service
 * Gere armazenamento local de relatórios criados offline
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// ========== TIPOS ==========

export interface OfflineReport {
  tempId: string;                    // UUID temporário gerado no mobile
  projectId: number;
  turbineId: number;
  reportType: number;
  language: 'EN' | 'ES';
  data: Record<string, any>;         // Dados do relatório em JSON
  photos: OfflinePhoto[];            // Fotos em base64 ou URI local
  status: 'editing' | 'pending_sync' | 'syncing' | 'sync_error';
  createdAt: string;                 // ISO date string
  lastModified: string;              // ISO date string
  syncAttempts: number;              // Quantas vezes tentou sincronizar
  syncError?: string;                // Mensagem de erro se falhou
}

export interface OfflinePhoto {
  tempId: string;
  uri: string;                       // URI local da foto
  base64?: string;                   // Dados em base64 (opcional)
  filename: string;
  mimeType: string;
  size?: number;
}

// ========== CONSTANTES ==========

const STORAGE_KEYS = {
  OFFLINE_REPORTS: '@gsclimbing:offline_reports',
  SYNC_QUEUE: '@gsclimbing:sync_queue',
  LAST_SYNC: '@gsclimbing:last_sync',
};

// ========== SERVICE ==========

class OfflineReportsService {
  /**
   * Criar novo relatório offline
   */
  async create(report: Omit<OfflineReport, 'tempId' | 'status' | 'createdAt' | 'lastModified' | 'syncAttempts'>): Promise<OfflineReport> {
    const tempId = uuidv4();
    const now = new Date().toISOString();

    const newReport: OfflineReport = {
      ...report,
      tempId,
      status: 'editing',
      createdAt: now,
      lastModified: now,
      syncAttempts: 0,
    };

    const reports = await this.getAll();
    reports.push(newReport);
    await this._saveAll(reports);

    console.log('📝 Relatório offline criado:', tempId);
    return newReport;
  }

  /**
   * Atualizar relatório offline existente
   */
  async update(tempId: string, updates: Partial<OfflineReport>): Promise<OfflineReport | null> {
    const reports = await this.getAll();
    const index = reports.findIndex(r => r.tempId === tempId);

    if (index === -1) {
      console.warn('⚠️ Relatório não encontrado:', tempId);
      return null;
    }

    const updated: OfflineReport = {
      ...reports[index],
      ...updates,
      lastModified: new Date().toISOString(),
    };

    reports[index] = updated;
    await this._saveAll(reports);

    console.log('✏️ Relatório offline atualizado:', tempId);
    return updated;
  }

  /**
   * Obter relatório por ID temporário
   */
  async getById(tempId: string): Promise<OfflineReport | null> {
    const reports = await this.getAll();
    return reports.find(r => r.tempId === tempId) || null;
  }

  /**
   * Obter todos os relatórios offline
   */
  async getAll(): Promise<OfflineReport[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_REPORTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios offline:', error);
      return [];
    }
  }

  /**
   * Obter relatórios pendentes de sincronização
   */
  async getPendingSync(): Promise<OfflineReport[]> {
    const reports = await this.getAll();
    return reports.filter(r => r.status === 'pending_sync');
  }

  /**
   * Obter relatórios em edição
   */
  async getEditing(): Promise<OfflineReport[]> {
    const reports = await this.getAll();
    return reports.filter(r => r.status === 'editing');
  }

  /**
   * Marcar relatório como pronto para sincronizar
   */
  async markForSync(tempId: string): Promise<boolean> {
    const updated = await this.update(tempId, { status: 'pending_sync' });
    return updated !== null;
  }

  /**
   * Marcar relatório como sincronizando
   */
  async markSyncing(tempId: string): Promise<boolean> {
    const updated = await this.update(tempId, { status: 'syncing' });
    return updated !== null;
  }

  /**
   * Marcar erro de sincronização
   */
  async markSyncError(tempId: string, error: string): Promise<boolean> {
    const report = await this.getById(tempId);
    if (!report) return false;

    const updated = await this.update(tempId, {
      status: 'sync_error',
      syncError: error,
      syncAttempts: report.syncAttempts + 1,
    });

    return updated !== null;
  }

  /**
   * Eliminar relatório offline
   */
  async delete(tempId: string): Promise<boolean> {
    const reports = await this.getAll();
    const filtered = reports.filter(r => r.tempId !== tempId);

    if (filtered.length === reports.length) {
      console.warn('⚠️ Relatório não encontrado para eliminar:', tempId);
      return false;
    }

    await this._saveAll(filtered);
    console.log('🗑️ Relatório offline eliminado:', tempId);
    return true;
  }

  /**
   * Limpar todos os relatórios sincronizados
   */
  async clearSynced(): Promise<number> {
    const reports = await this.getAll();
    const unsyncedReports = reports.filter(r => 
      r.status === 'editing' || 
      r.status === 'pending_sync' || 
      r.status === 'sync_error'
    );

    const removedCount = reports.length - unsyncedReports.length;
    await this._saveAll(unsyncedReports);

    console.log(`🧹 ${removedCount} relatórios sincronizados removidos`);
    return removedCount;
  }

  /**
   * Obter contadores
   */
  async getCounts(): Promise<{
    total: number;
    editing: number;
    pendingSync: number;
    syncError: number;
  }> {
    const reports = await this.getAll();

    return {
      total: reports.length,
      editing: reports.filter(r => r.status === 'editing').length,
      pendingSync: reports.filter(r => r.status === 'pending_sync').length,
      syncError: reports.filter(r => r.status === 'sync_error').length,
    };
  }

  /**
   * Guardar timestamp da última sincronização
   */
  async setLastSync(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  /**
   * Obter timestamp da última sincronização
   */
  async getLastSync(): Promise<Date | null> {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * Método privado para guardar todos os relatórios
   */
  private async _saveAll(reports: OfflineReport[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_REPORTS,
        JSON.stringify(reports)
      );
    } catch (error) {
      console.error('❌ Erro ao guardar relatórios offline:', error);
      throw error;
    }
  }

  /**
   * Limpar TUDO (usar com cuidado!)
   */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.OFFLINE_REPORTS,
      STORAGE_KEYS.SYNC_QUEUE,
      STORAGE_KEYS.LAST_SYNC,
    ]);
    console.log('🧹 Todos os dados offline limpos');
  }
}

// Exportar instância única (singleton)
export const offlineReportsService = new OfflineReportsService();
